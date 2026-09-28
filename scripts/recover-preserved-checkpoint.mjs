// Operator-only recovery of the explicitly approved pre-QA checkpoint failure.
// No generation, customer edits, emails, approval or production deployment.
import assert from 'node:assert/strict';
import {readFile,realpath,lstat} from 'node:fs/promises';
import {parseEnv} from 'node:util';
import path from 'node:path';
import pg from 'pg';
import {command} from './build-worker/runtime.mjs';
import {fingerprint,saveCheckpoint,loadCheckpoint} from './build-worker/checkpoint.mjs';
import {validateScope,verifyManifestDiff} from './build-worker/generator.mjs';
import {customerSiteSchema} from '../lib/customers/schema.ts';
const id='be19fdd6-cd63-4313-9c75-c8c187486024';
const requestId='c22f0dc2-5b94-4998-a8fb-f873790802ad',slug='nasirtesting';
const baseline='763e84637d03226d6cd045d3401c5ca2d4660e95';
const expectedFingerprint='bcd3ec4dec6ae84f30e78925442de1538f22d46859b3e17f5f40b5e1d9407da5';
const dir=path.resolve('../rs-webfactory-builds',id);
const prod=parseEnv(await readFile('.env.production.local','utf8'));
const worker=parseEnv(await readFile('.env.worker.local','utf8'));
const db=new pg.Client({connectionString:prod.LEADS_DATABASE_URL,connectionTimeoutMillis:10000});
const commit=process.argv.includes('--queue-same-artifact');
let connected=false;
try{
 assert.equal(await realpath(dir),dir);assert.equal((await lstat(dir)).isSymbolicLink(),false);
 assert.equal(await command('git',['rev-parse','HEAD'],dir),baseline);
 assert.equal(await command('git',['branch','--show-current'],dir),`webfactory/build/${id}-${slug}`);
 const files=[...new Set([...(await command('git',['diff','--name-only'],dir)).split('\n'),...(await command('git',['ls-files','--others','--exclude-standard'],dir)).split('\n')].filter(Boolean))].sort();
 validateScope(slug,files);assert.equal(files.length,6);
 verifyManifestDiff(JSON.parse(await command('git',['show',baseline+':customers/manifest.json'],dir)),JSON.parse(await readFile(path.join(dir,'customers/manifest.json'),'utf8')),slug);
 const site=customerSiteSchema.parse(JSON.parse(await readFile(path.join(dir,`customers/${slug}/site/customer.config.json`),'utf8')));
 assert.equal(site.slug,slug);assert.equal(site.form.mode,'disabled');assert.equal(site.myndy.embed.enabled,false);
 assert.equal(await fingerprint(dir),expectedFingerprint);
 const response=await fetch('https://red-spectrum-website-factory.vercel.app/api/internal/build-worker',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+worker.WEBFACTORY_BUILD_WORKER_SECRET},body:JSON.stringify({action:'heartbeat',jobId:id,lease:'0'.repeat(64)}),signal:AbortSignal.timeout(15000)});
 // A valid credential with a deliberately invalid lease must be rejected, not 404/401.
 assert.equal(response.status,409);
 await db.connect();connected=true;
 const row=(await db.query('SELECT j.status,j.error_category,j.qa_result,j.brief_id,r.customer_slug,w.stage,w.active_brief_id,r.business FROM webfactory.website_build_jobs j JOIN webfactory.requests r ON r.id=j.request_id JOIN webfactory.build_workflows w ON w.request_id=r.id WHERE j.id=$1 AND j.request_id=$2',[id,requestId])).rows[0];
 assert.equal(row.status,'failed');assert.equal(row.error_category,'SCOPE_REJECTED');assert.equal(row.customer_slug,slug);assert.equal(row.stage,'build_approved');assert.equal(row.active_brief_id,row.brief_id);assert.equal(site.business.name,row.business);assert.equal(Boolean(row.qa_result?.checkpoint),false);
 assert.equal((await db.query("SELECT id FROM webfactory.website_build_jobs WHERE status NOT IN ('failed','cancelled','ready_for_review','changes_requested')")).rowCount,0);
 const events=(await db.query('SELECT status FROM webfactory.website_build_job_events WHERE job_id=$1 ORDER BY id',[id])).rows.map(r=>r.status);
 assert.ok(events.includes('building'));assert.equal(events.includes('qa_running'),false);
 console.log(JSON.stringify({precheck:'PASS',jobId:id,slug,files:files.length,artifactSha:expectedFingerprint,productionWorkerApi:'authenticated-invalid-lease-rejected',newGeneration:false}));
 if(commit){
  // Provider response metadata was lost before the original checkpoint. Record this
  // explicitly rather than claiming a model was observed during recovery.
  const provider={name:'openai',model:'original-model-unrecorded'};
  let checkpoint;
  try{checkpoint=JSON.parse(await readFile(path.join(dir,'.git/webfactory-qa.json'),'utf8'));}
  catch(e){if(e.code!=='ENOENT')throw e;checkpoint=await saveCheckpoint({dir,baseline},{id,customerSlug:slug},files,provider);}
  const metadata={artifactSha:expectedFingerprint,baselineSha:baseline,provider};
  await loadCheckpoint(dir,{id,customerSlug:slug,checkpoint:metadata});
  assert.deepEqual(checkpoint.files,files);
  await db.query('BEGIN');await db.query("SET LOCAL statement_timeout='10s'");
  // Queue writes/claims cannot race this one-time global no-active-job check.
  await db.query('LOCK TABLE webfactory.website_build_jobs IN SHARE ROW EXCLUSIVE MODE');
  const current=(await db.query('SELECT customer_slug FROM webfactory.requests WHERE id=$1 FOR UPDATE',[requestId])).rows[0];
  const workflow=(await db.query('SELECT stage,active_brief_id FROM webfactory.build_workflows WHERE request_id=$1 FOR UPDATE',[requestId])).rows[0];
  assert.equal(current.customer_slug,slug);assert.equal(workflow.stage,'build_approved');assert.equal(workflow.active_brief_id,row.brief_id);
  assert.equal((await db.query("SELECT id FROM webfactory.website_build_jobs WHERE status NOT IN ('failed','cancelled','ready_for_review','changes_requested')")).rowCount,0);
  const updated=await db.query("UPDATE webfactory.website_build_jobs SET status='queued',progress_code='checkpoint_recovery_queued',error_category=NULL,finished_at=NULL,lease_hash=NULL,lease_expires_at=NULL,cancel_requested=false,qa_result=qa_result||$2::jsonb WHERE id=$1 AND status='failed' AND error_category='SCOPE_REJECTED' AND NOT (qa_result ? 'checkpoint')",[id,JSON.stringify({checkpoint:metadata,resume:true,retryCount:1,recovery:{sourceJobId:id,artifactSha:expectedFingerprint,reason:'contained_next_dependency_link_checkpoint_fix',originalFailure:'SCOPE_REJECTED',providerModelEvidence:'not persisted by original attempt',newGeneration:false,recordedAt:new Date().toISOString()}})]);
  assert.equal(updated.rowCount,1);
  await db.query("INSERT INTO webfactory.website_build_job_events(job_id,status,code,actor) VALUES($1,'queued','checkpoint_recovery_same_artifact','authorized-admin-recovery')",[id]);
  await db.query("INSERT INTO webfactory.request_actions(request_id,actor,action,status_before,status_after,customer_slug,notes) VALUES($1,'authorized-admin-recovery','checkpoint_recovery','build_approved','build_approved',$2,$3)",[requestId,slug,'Same job and immutable artifact '+expectedFingerprint+'. No AI regeneration.']);
  await db.query('COMMIT');console.log('Same job queued for checkpoint-verified QA recovery; no new build job or AI generation.');
 }
}catch(error){if(connected)await db.query('ROLLBACK').catch(()=>{});console.error('Recovery stopped safely: '+(error.code==='ERR_ASSERTION'?'precondition mismatch':error.message==='SCOPE_REJECTED'?'SCOPE_REJECTED':'operation unavailable'));process.exitCode=1;}finally{await db.end().catch(()=>{});}
