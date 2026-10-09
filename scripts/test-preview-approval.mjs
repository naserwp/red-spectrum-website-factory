import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import ts from 'typescript';
import {z} from 'zod';
const load=(file,deps)=>{const m={exports:{}};new Function('require','module','exports',ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(name=>deps[name],m,m.exports);return m.exports;};
const diagnostics=load('lib/webfactory/qa-diagnostics.ts',{}),executor=load('lib/webfactory/build-executor.ts',{});
const contract=load('lib/webfactory/worker-contract.ts',{zod:{z},'./qa-diagnostics':diagnostics,'./build-paths':load('lib/webfactory/build-paths.ts',{})});
const {verifiedBuildEvidence}=load('lib/webfactory/build-evidence.ts',{'./worker-contract':contract,'./build-executor':executor});
const context={requestId:randomUUID(),briefId:randomUUID(),slug:'synthetic'},id=randomUUID();
const job={id,request_id:context.requestId,customer_slug:context.slug,brief_id:context.briefId,status:'ready_for_review',baseline_sha:'a'.repeat(40),result_sha:'b'.repeat(40),build_branch:`webfactory/build/${id}-synthetic`,changed_files:['customers/manifest.json'],preview_url:'https://synthetic-preview.vercel.app/synthetic',deployment_reference:'dpl_synthetic',provider_metadata:{name:'openai',model:'synthetic'},qa_result:{...Object.fromEntries(executor.requiredBuildChecks.map(k=>[k,true])),preview_access:{preview_deployment_exists:true,preview_authenticated_access_verified:true,preview_customer_identity_verified:true,preview_public_access:'protected',pages:['/','/services','/about','/contact','/privacy']}}};
assert.equal(verifiedBuildEvidence(job,context).protection,'protected');
const withPages=pages=>({...job,qa_result:{...job.qa_result,preview_access:{...job.qa_result.preview_access,pages}}});
assert(verifiedBuildEvidence(withPages([...job.qa_result.preview_access.pages,'/faq']),context));
for(const pages of [['/','/faq'],[...job.qa_result.preview_access.pages,'/other'],[...job.qa_result.preview_access.pages,'/faq','/faq']])assert.equal(verifiedBuildEvidence(withPages(pages),context),null);
for(const status of ['failed','qa_running','preview_verifying','queued'])assert.equal(verifiedBuildEvidence({...job,status},context),null);
for(const flag of executor.requiredBuildChecks)assert.equal(verifiedBuildEvidence({...job,qa_result:{...job.qa_result,[flag]:false}},context),null);
for(const flag of ['preview_deployment_exists','preview_authenticated_access_verified','preview_customer_identity_verified'])assert.equal(verifiedBuildEvidence({...job,qa_result:{...job.qa_result,preview_access:{...job.qa_result.preview_access,[flag]:false}}},context),null);
for(const field of ['requestId','briefId','slug'])assert.equal(verifiedBuildEvidence(job,{...context,[field]:'wrong'}),null);
assert.equal(verifiedBuildEvidence({...job,preview_url:'https://attacker.example/synthetic'},context),null);
assert.equal(verifiedBuildEvidence({...job,changed_files:['customers/other/site/customer.config.json']},context),null);
assert.equal(verifiedBuildEvidence({...job,qa_result:{...job.qa_result,attempts:[{results:[{status:'failed'}]}]}},context),null);
console.log('PASS: ready_for_review + protected authenticated evidence accepted; failed/QA-failed/unverified/wrong identity/request/brief/slug/URL/scope rejected. No network or DB writes.');

// Exercise the real rebuild gate with isolated database responses, never live writes.
let candidates=[],receipt=null,inserted=false;
const client={release(){},async query(sql,params){
 if(sql.startsWith('SELECT customer_slug'))return {rows:[{customer_slug:context.slug}]};
 if(sql.startsWith('SELECT stage'))return {rows:[{stage:'build_approved',active_brief_id:context.briefId}]};
 if(sql.startsWith('SELECT * FROM webfactory.website_build_jobs')){assert.deepEqual(params,[context.requestId,context.slug,context.briefId]);return {rows:candidates};}
 if(sql.startsWith('SELECT brief'))return {rows:[{brief:{}}]};
 if(sql.startsWith('INSERT INTO webfactory.website_build_jobs'))inserted=true;
 return {rows:[],rowCount:0};
}};
const rebuild=load('lib/webfactory/build-jobs.ts',{'server-only':{},'node:crypto':{randomUUID},'./server':{database:()=>({connect:async()=>client})},'./brief-schema':{briefSchema:{safeParse:()=>({success:true,data:{}})},codexBuildPrompt:()=>''},'./slug-rules':{slugError:()=>null},'@/lib/customers/registry':{getCustomerSite:()=>({})},'./build-receipts':{getLocalBuildReceipt:()=>receipt},'./build-executor':{configuredBuildExecutor:()=>null},'./build-evidence':{verifiedBuildEvidence}});
for(const invalid of [[],[{...job,request_id:randomUUID()}],[{...job,brief_id:randomUUID()}],[{...job,customer_slug:'another'}],[{...job,status:'failed'}],[{...job,qa_result:{}}]]){
 candidates=invalid;inserted=false;await assert.rejects(()=>rebuild.createBuildJob(context.requestId,randomUUID(),'test','approved revision'),/Resolve ownership/);assert.equal(inserted,false);
}
candidates=[job];await rebuild.createBuildJob(context.requestId,randomUUID(),'test','approved revision');assert(inserted);
candidates=[];receipt={customerSlug:context.slug};inserted=false;await rebuild.createBuildJob(context.requestId,randomUUID(),'test','approved revision');assert(inserted);
console.log('PASS: existing verified tenant can rebuild; wrong request/brief/slug, unfinished or unverified ownership cannot; legacy receipt remains supported.');
