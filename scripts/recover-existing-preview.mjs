// Explicitly approved operator recovery. Never generates, builds, runs QA or deploys.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseEnv} from 'node:util';
import pg from 'pg';
import {command} from './build-worker/runtime.mjs';
import {loadCheckpoint} from './build-worker/checkpoint.mjs';
import {verifyProtectedPreview} from '../lib/webfactory/preview-verification.ts';
import {requiredBuildChecks} from '../lib/webfactory/build-executor.ts';
const id='be19fdd6-cd63-4313-9c75-c8c187486024',requestId='c22f0dc2-5b94-4998-a8fb-f873790802ad',slug='nasirtesting';
const dir='../rs-webfactory-builds/'+id,sha='b9732f1dbe3876b67ef5f51cbdb68e619eff1a99';
const deployment={sha,reference:'dpl_9yBgHkpsmgVv8NL2EN9fGqQuGRQq',url:'https://red-spectrum-website-factory-o8uvnnyk4-naserwps-projects.vercel.app'};
const artifact='bcd3ec4dec6ae84f30e78925442de1538f22d46859b3e17f5f40b5e1d9407da5';
const prod=parseEnv(await readFile('.env.production.local','utf8')),env=parseEnv(await readFile('.env.worker.local','utf8'));
const db=new pg.Client({connectionString:prod.LEADS_DATABASE_URL,connectionTimeoutMillis:10000});let connected=false;
try{
 await db.connect();connected=true;
 const j=(await db.query('SELECT * FROM webfactory.website_build_jobs WHERE id=$1 AND request_id=$2',[id,requestId])).rows[0];
 assert.equal(j.status,'failed');assert.equal(j.error_category,'WORKER_INTERRUPTED');assert.equal(j.customer_slug,slug);assert.equal(j.qa_result.checkpoint.artifactSha,artifact);
 const checkpoint=await loadCheckpoint(dir,{id,customerSlug:slug,checkpoint:j.qa_result.checkpoint});
 assert.equal(await command('git',['rev-parse','HEAD'],dir),sha);assert.equal(await command('git',['rev-parse','HEAD^'],dir),checkpoint.baseline);
 assert.equal(await command('git',['branch','--show-current'],dir),`webfactory/build/${id}-${slug}`);assert.equal(await command('git',['status','--porcelain'],dir),'');
 const results=j.qa_result.attempts.at(-1).results;
 assert.equal(results.length,92);assert(results.every(r=>r.status==='passed'));
 for(const width of [320,768,1440])for(const page of ['','/services','/about','/contact','/privacy'])assert(results.some(r=>r.viewport===width&&r.page===page&&r.check_name==='mobile-overflow'));
 const events=(await db.query('SELECT status FROM webfactory.website_build_job_events WHERE job_id=$1',[id])).rows.map(r=>r.status);assert(events.includes('building'));assert(events.includes('preview_verifying'));
 const manifest=JSON.parse(await readFile(dir+'/customers/manifest.json','utf8')),site=manifest.customers.find(c=>c.slug===slug);
 const access=await verifyProtectedPreview({previewUrl:deployment.url+'/'+slug,deploymentReference:deployment.reference,resultSha:sha,slug,business:site.business.name},{apiGet:async endpoint=>JSON.parse(await command(process.execPath,[env.VERCEL_CLI,'api',endpoint],process.cwd(),{},30000)),otherNames:manifest.customers.filter(c=>c.slug!==slug).map(c=>c.business.name),privateValues:[id,requestId,j.brief_id]});
 console.log(JSON.stringify({integrity:'PASS',existingQaChecks:results.length,access,newGeneration:false,newDeployment:false}));
 if(process.argv.includes('--queue-existing-preview')){
  await db.query('BEGIN');await db.query("SET LOCAL statement_timeout='10s'");
  const r=(await db.query('SELECT customer_slug FROM webfactory.requests WHERE id=$1 FOR UPDATE',[requestId])).rows[0];
  const w=(await db.query('SELECT stage,active_brief_id FROM webfactory.build_workflows WHERE request_id=$1 FOR UPDATE',[requestId])).rows[0];
  assert.equal(r.customer_slug,slug);assert.equal(w.stage,'build_approved');assert.equal(w.active_brief_id,j.brief_id);
  await db.query('LOCK TABLE webfactory.website_build_jobs IN SHARE ROW EXCLUSIVE MODE');
  assert.equal((await db.query("SELECT id FROM webfactory.website_build_jobs WHERE status NOT IN ('failed','cancelled','ready_for_review','changes_requested')")).rowCount,0);
  const recovery={artifactSha:artifact,deployment,qa:Object.fromEntries(requiredBuildChecks.map(k=>[k,true])),sourceJobId:id,recordedAt:new Date().toISOString()};
  const update=await db.query("UPDATE webfactory.website_build_jobs SET status='queued',progress_code='existing_preview_recovery_queued',error_category=NULL,finished_at=NULL,lease_hash=NULL,lease_expires_at=NULL,cancel_requested=false,qa_result=qa_result||$2::jsonb WHERE id=$1 AND status='failed' AND error_category='WORKER_INTERRUPTED' AND NOT (qa_result ? 'previewRecovery')",[id,JSON.stringify({resume:false,resumePreview:true,previewRecovery:recovery})]);assert.equal(update.rowCount,1);
  await db.query("INSERT INTO webfactory.website_build_job_events(job_id,status,code,actor) VALUES($1,'queued','same_artifact_same_deployment_recovery','authorized-admin-recovery')",[id]);
  await db.query('COMMIT');console.log('Same job queued for verification only. No generation/build/QA/deployment rerun.');
 }
}catch{if(connected)await db.query('ROLLBACK').catch(()=>{});console.error('Existing-preview recovery stopped: integrity, approval or authenticated verification did not pass.');process.exitCode=1;}finally{await db.end().catch(()=>{});}
