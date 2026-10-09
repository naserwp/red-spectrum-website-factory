import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {randomUUID,randomBytes,createHash} from 'node:crypto';import ts from 'typescript';import {z} from 'zod';
const load=(file,deps={})=>{const m={exports:{}};new Function('require','module','exports',ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(n=>n==='server-only'?{}:deps[n],m,m.exports);return m.exports;};
const contract=load('lib/webfactory/worker-contract.ts',{zod:{z},'./build-paths':{},'./qa-diagnostics':load('lib/webfactory/qa-diagnostics.ts')});
const first=randomUUID(),target=randomUUID(),missing=randomUUID(),brief=randomUUID(),request=randomUUID();const updated=[],expired=[];
const jobs=[first,target].map(id=>({id,request_id:request,customer_slug:'test-tenant',brief_id:brief,approved_brief:{},qa_result:{}}));
const query=async(sql,args=[])=>{
 if(sql.startsWith('WITH expired')){assert.match(sql,/WHERE \(\$1::uuid IS NULL OR id=\$1\) AND lease_expires_at/);expired.push(args[0]);return {rows:[]};}
 if(sql.startsWith('SELECT * FROM webfactory.website_build_jobs')){assert.match(sql,/WHERE \(\$1::uuid IS NULL OR id=\$1\) AND status='queued'/);return {rows:jobs.filter(j=>args[0]===null||j.id===args[0]).slice(0,1)};}
 if(sql.includes('SELECT r.customer_slug'))return {rows:[{customer_slug:'test-tenant',active_brief_id:brief,stage:'build_approved'}]};
 if(sql.startsWith('UPDATE webfactory.website_build_jobs'))updated.push(args[0]);
 return {rows:[]};
};
const worker=load('lib/webfactory/build-worker.ts',{'node:crypto':{randomBytes},'./server':{database:()=>({query,connect:async()=>({query,release(){}})}),digest:s=>createHash('sha256').update(s).digest('hex')},'./worker-contract':contract,'./build-executor':{},'./preview-verification':{},'@/lib/customers/registry':{},'./build-evidence':{}});
const prior=process.env.WEBFACTORY_BUILD_EXECUTOR;process.env.WEBFACTORY_BUILD_EXECUTOR='controlled-worker-v1';
try{
 const diagnostic={check_name:'logo-home-link',status:'passed',page:'/faq',viewport:430,duration:1,timestamp:new Date().toISOString()};
 assert(contract.workerInput.safeParse({action:'qa_report',jobId:target,lease:'a'.repeat(64),diagnostics:[diagnostic]}).success);
 assert(!contract.qaDiagnosticSchema.safeParse({...diagnostic,page:'/other-tenant'}).success);
 for(const jobId of [target,missing,undefined])assert(contract.workerInput.safeParse({action:'claim',workerId:'test',...(jobId?{jobId}:{})}).success);
 assert(!contract.workerInput.safeParse({action:'claim',workerId:'test',jobId:'invalid'}).success);
 assert.equal((await worker.workerOperation({action:'claim',workerId:'test',jobId:target})).job.id,target);
 assert.equal((await worker.workerOperation({action:'claim',workerId:'test',jobId:missing})).job,null);
 assert.equal((await worker.workerOperation({action:'claim',workerId:'test'})).job.id,first);
 assert.deepEqual(updated,[target,first]);assert.deepEqual(expired,[target,missing,null]);
 console.log('PASS: exact target claim, nonexistent target has no fallback, scoped expiration, UUID validation and unchanged default FIFO behavior.');
}finally{if(prior===undefined)delete process.env.WEBFACTORY_BUILD_EXECUTOR;else process.env.WEBFACTORY_BUILD_EXECUTOR=prior;}
