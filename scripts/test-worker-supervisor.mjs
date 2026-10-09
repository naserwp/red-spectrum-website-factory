import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {supervise} from './build-worker/supervisor.mjs';
import {launch,stop} from './build-worker/runtime.mjs';

let starts=0;const delays=[],events=[];
assert.equal(await supervise({signal:new AbortController().signal,start:()=>launch(process.execPath,['-e',`process.exit(${++starts<3?7:0})`],{stdio:'ignore'}),wait:async ms=>delays.push(ms),log:e=>events.push(e)}),0);
assert.equal(starts,3);assert.deepEqual(delays,[1000,2000]);
starts=0;
assert.equal(await supervise({signal:new AbortController().signal,start:()=>{starts++;return launch(process.execPath,['-e','process.exit(9)'],{stdio:'ignore'});},wait:async()=>{},log:()=>{}}),1);
assert.equal(starts,4);

// Real worker process against a local control plane; no credentials, AI, DB or jobs.
const root=await mkdtemp(path.join(tmpdir(),'wf-supervisor-'));let child,pulses=0,claims=0,runs=0;
const controller=new AbortController();
let finish;const completed=new Promise(r=>finish=r);
const server=createServer(async(req,res)=>{
 let body='';for await(const part of req)body+=part;
 assert.equal(req.headers.authorization,'Bearer '+'x'.repeat(40));
 const data=JSON.parse(body);
 if(data.action==='pulse')pulses++;
 else{assert.equal(data.action,'claim');claims++;}
 res.setHeader('Content-Type','application/json');res.end(JSON.stringify(data.action==='claim'?{job:null}:{ok:true}));
 if(data.action==='claim'&&runs===1)setTimeout(()=>stop(child),20);
 if(data.action==='claim'&&runs===2){controller.abort();finish();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const timer=setTimeout(()=>{controller.abort();finish();},20000);
try{
 const env={...process.env,WEBFACTORY_BUILD_CONTROL_URL:`http://127.0.0.1:${server.address().port}`,WEBFACTORY_BUILD_WORKER_SECRET:'x'.repeat(40),WEBFACTORY_BUILD_ROOT:root,WEBFACTORY_BUILD_BASE_SHA:'a'.repeat(40),AGENT_BROWSER_CLI:'unused-no-jobs',VERCEL_TOKEN:'unused-no-jobs',WEBFACTORY_BUILD_HEALTH_ENABLED:'true'};
 delete env.OPENAI_API_KEY;
 const running=supervise({signal:controller.signal,start:()=>{runs++;child=launch(process.execPath,['scripts/build-worker/run.mjs'],{env,stdio:'ignore'});return child;},wait:async()=>{},log:()=>{}});
 await completed;assert.equal(await running,0);assert.equal(runs,2);assert.equal(pulses,2);assert.equal(claims,2);
 console.log('PASS: real process startup, authenticated heartbeat/poll, crash restart, bounded restart storm, clean shutdown; no service installed or customer job claimed.');
}finally{clearTimeout(timer);controller.abort();server.close();}
