import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseEnv} from 'node:util';
import {randomUUID} from 'node:crypto';
import ts from 'typescript';
import pg from 'pg';
import {z} from 'zod';
const load=(file,deps)=>{const m={exports:{}};new Function('require','module','exports',ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(n=>{if(n==='server-only')return {};if(n in deps)return deps[n];throw Error('Unexpected dependency');},m,m.exports);return m.exports;};
const env={...parseEnv(readFileSync(process.env.WEBFACTORY_TEST_ENV_FILE || '.env.local','utf8')),...process.env};
const pool=new pg.Pool({connectionString:env.LEADS_DATABASE_URL,connectionTimeoutMillis:5000});
const brief=load('lib/webfactory/brief-schema.ts',{zod:{z}}),rules=load('lib/webfactory/slug-rules.ts',{}),executor=load('lib/webfactory/build-executor.ts',{});
const service=load('lib/webfactory/build-jobs.ts',{'node:crypto':{randomUUID},'./server':{database:()=>pool},'./brief-schema':brief,'./slug-rules':rules,'@/lib/customers/registry':{getCustomerSite:()=>null},'./build-receipts':{getLocalBuildReceipt:()=>null},'./build-executor':executor});
const id=randomUUID(),briefId=randomUUID(),slug='qa-build-'+randomUUID().slice(0,8);
const snapshot={customerSlug:'old-ai-slug',businessSummary:'Synthetic only',brandDirection:'Draft',colorDirection:'Draft',logoConcept:'Draft',pages:brief.pageNames.map(name=>({name,purpose:'Draft',sections:[]})),services:[],seo:{title:'Draft',metaDescription:'Draft'},hero:{heading:'Draft',body:'Draft'},ctaCopy:[],myndy:{agentName:'Draft',avatarBrief:'Draft',greeting:'Draft',context:'Draft',faqs:[],qualificationFlow:[],escalationRules:[]},imagePrompts:[],customerEmailDraft:'Unsent',smsDraft:'Unsent',missingInformation:[],verificationNotes:[]};
try{
 await pool.query("INSERT INTO webfactory.requests(id,submission_id,access_hash,name,business,email,industry,details) VALUES($1,$2,'synthetic','Build QA','Build QA','qa@example.invalid','Test','Synthetic')",[id,randomUUID()]);
 await assert.rejects(()=>service.createBuildJob(id,randomUUID(),'test',''),/slug/);
 await pool.query('UPDATE webfactory.requests SET customer_slug=$2 WHERE id=$1',[id,slug]);
 await assert.rejects(()=>service.createBuildJob(id,randomUUID(),'test',''),/approval/);
 await pool.query("INSERT INTO webfactory.ai_briefs(id,request_id,status,model,brief) VALUES($1,$2,'generated','synthetic',$3)",[briefId,id,JSON.stringify(snapshot)]);
 await pool.query("INSERT INTO webfactory.build_workflows(request_id,active_brief_id,stage) VALUES($1,$2,'build_approved')",[id,briefId]);
 const submission=randomUUID();const results=await Promise.all([service.createBuildJob(id,submission,'test',''),service.createBuildJob(id,submission,'test','')]);assert.equal(results[0],results[1]);
 const row=(await pool.query('SELECT * FROM webfactory.website_build_jobs WHERE id=$1',[results[0]])).rows[0];
 assert.equal(row.status,'failed');assert.equal(row.error_category,'BUILD_EXECUTOR_NOT_CONFIGURED');assert.equal(row.approved_brief.customerSlug,slug);assert.ok(row.instructions.includes('"customerSlug": "'+slug+'"'));assert.deepEqual(row.changed_files,[]);assert.equal(row.preview_url,null);
 assert.equal((await service.listBuildJobs(id)).jobs.length,1);assert.equal((await service.listBuildJobs(randomUUID())).jobs.length,0);
 await assert.rejects(()=>service.cancelBuildJob(randomUUID(),row.id,'test'),/not found/);
 await assert.rejects(()=>service.cancelBuildJob(id,row.id,'test'),/terminal/);
 // Controlled fixture: simulate queued job to exercise cancellation and active guard, never dispatch.
 await pool.query("UPDATE webfactory.website_build_jobs SET status='queued' WHERE id=$1",[row.id]);
 await assert.rejects(()=>service.createBuildJob(id,randomUUID(),'test',''),/already active/);
 await service.cancelBuildJob(id,row.id,'test');assert.equal((await service.listBuildJobs(id)).jobs[0].status,'cancelled');
 assert.equal((await pool.query('SELECT stage FROM webfactory.build_workflows WHERE request_id=$1',[id])).rows[0].stage,'build_approved');
 console.log('PASS: approval/slug gates, canonical snapshot, idempotent concurrent duplicate, persistent failure/events, polling, active guard, cancellation, request isolation, no fabricated artifacts/status.');
}finally{
 await pool.query('DELETE FROM webfactory.website_build_job_events WHERE job_id IN (SELECT id FROM webfactory.website_build_jobs WHERE request_id=$1)',[id]);
 await pool.query('DELETE FROM webfactory.website_build_jobs WHERE request_id=$1',[id]);
 await pool.query('DELETE FROM webfactory.build_workflows WHERE request_id=$1',[id]);
 await pool.query('DELETE FROM webfactory.ai_briefs WHERE request_id=$1',[id]);
 await pool.query('DELETE FROM webfactory.request_actions WHERE request_id=$1',[id]);
 await pool.query('DELETE FROM webfactory.requests WHERE id=$1',[id]);await pool.end();
}
