// Proves the QA-evidence partitioning keeps a complete review sweep inside the
// control plane's request limits, loses no check and cannot launder a failure.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import ts from 'typescript';
import {z} from 'zod';
import {batches,bodyBudget} from './build-worker/evidence-batches.mjs';
const load=(file,deps)=>{const m={exports:{}};new Function('require','module','exports',ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(n=>{if(n in deps)return deps[n];throw Error('Unexpected dependency');},m,m.exports);return m.exports;};
const diagnostics=load('lib/webfactory/qa-diagnostics.ts',{}),paths=load('lib/webfactory/build-paths.ts',{});
const contract=load('lib/webfactory/worker-contract.ts',{zod:{z},'./qa-diagnostics':diagnostics,'./build-paths':paths});
// The literal ceiling enforced by app/api/internal/build-worker/route.ts.
const controlPlaneBodyLimit=24000;
const sweep=()=>{
 const results=[];const rec=(name,page='',viewport=0,duration=120)=>results.push({check_name:name,status:'passed',page,viewport,duration,timestamp:new Date().toISOString()});
 rec('privacy');rec('server-start');
 for(const page of ['','/services','/about','/contact','/privacy']){
  rec('customer-route',page);rec('customer-identity',page);rec('metadata',page);rec('privacy',page);rec('tenant-isolation',page);
  for(const viewport of [320,375,768,1024,1440,1920]){
   rec('mobile-overflow',page,viewport);rec('images',page,viewport);rec('tenant-isolation',page,viewport);rec('page-error',page,viewport);
   rec('browser-check',page,viewport);
   if(viewport===320)rec('browser-check',page,viewport);
   if(page===''&&viewport===1440)rec('artifact-integrity',page,viewport);
   rec('browser-check',page,viewport);
  }
 }
 return results;
};
const envelope=diagnostics=>Buffer.byteLength(JSON.stringify({action:'qa_report',jobId:randomUUID(),lease:'x'.repeat(64),diagnostics}));
const evidence=sweep();
const groups=batches(evidence);
// Regression: the single unsplit report is what the control plane refused.
assert.ok(envelope(evidence)>controlPlaneBodyLimit,'the full sweep must still exceed the single-body limit, otherwise this test proves nothing');
assert.ok(groups.length>1,'a full sweep must partition into more than one report');
for(const group of groups){
 assert.ok(envelope(group)<=controlPlaneBodyLimit,'every batch must fit the control plane body limit');
 assert.ok(group.length<=320,'every batch must fit the control plane schema maximum');
 for(const d of group)assert.equal(contract.workerInput.safeParse({action:'qa_report',jobId:randomUUID(),lease:'x'.repeat(64),diagnostics:[d]}).success,true,'each diagnostic must still satisfy the worker contract');
}
assert.deepEqual(groups.flat(),evidence,'partitioning must drop and reorder nothing');
assert.ok(bodyBudget<controlPlaneBodyLimit,'the byte budget must leave headroom for the request envelope');
// A sweep that ends in a failure: every batch before the failing one is safe to
// report, and the batch holding the failure is the one carried by the fail call.
const withFailure=[...evidence,{check_name:'browser-check',status:'failed',page:'/privacy',viewport:1920,duration:9,timestamp:new Date().toISOString()}];
const failGroups=batches(withFailure),terminal=failGroups.pop();
assert.ok(failGroups.every(g=>g.every(d=>d.status==='passed')),'no batch submitted as a passing report may contain a failure');
assert.ok(terminal.some(d=>d.status==='failed'),'the terminal report must carry the failure so the reason is recorded');
assert.equal(failGroups.flat().length+terminal.length,withFailure.length,'no evidence may be discarded when a sweep fails');
assert.ok(envelope(terminal)<=controlPlaneBodyLimit,'the terminal fail body must fit so the revision always reaches a terminal state');
console.log(`PASS: ${evidence.length} checks (${envelope(evidence)} bytes) partition into ${groups.length} batches, max ${Math.max(...groups.map(envelope))} bytes; nothing dropped; failures cannot be laundered.`);
