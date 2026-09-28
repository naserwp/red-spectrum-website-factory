import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdtemp} from 'node:fs/promises';
import {parseEnv} from 'node:util';
import path from 'node:path';
import {command,launch,stop,assertRoot} from './build-worker/runtime.mjs';
const env=parseEnv(await readFile('.env.worker.local','utf8'));
assertRoot(env.WEBFACTORY_BUILD_ROOT,process.cwd());
assert.throws(()=>assertRoot(process.cwd(),process.cwd()));
assert.throws(()=>assertRoot(path.join(process.cwd(),'builds'),process.cwd()));
assert.equal(await command('git',['check-ignore','.env.worker.local'],process.cwd()),'.env.worker.local');
assert.match(await command('npm',['--version'],process.cwd()),/^\d+\./);
let polls=0;
const server=createServer((req,res)=>{assert.equal(req.headers.authorization,'Bearer '+env.WEBFACTORY_BUILD_WORKER_SECRET);polls++;res.setHeader('Content-Type','application/json');res.end('{"job":null}');});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const testEnv={...env,WEBFACTORY_BUILD_CONTROL_URL:`http://127.0.0.1:${server.address().port}`};
try{
 for(let n=0;n<2;n++){
  const out=await command(process.execPath,['scripts/build-worker/run.mjs','--once'],process.cwd(),testEnv,30000);
  assert(out.includes('Waiting for build jobs'));assert(!out.includes(env.WEBFACTORY_BUILD_WORKER_SECRET));assert(!out.includes(env.OPENAI_API_KEY));
 }
 assert.equal(polls,2);
 for(const args of [['open','about:blank'],['snapshot','-i'],['close']])await command(process.execPath,[env.AGENT_BROWSER_CLI,'--session','worker-synthetic-qa',...args],process.cwd(),{AGENT_BROWSER_EXECUTABLE_PATH:env.AGENT_BROWSER_EXECUTABLE_PATH},20000);
 const child=launch(process.execPath,['scripts/build-worker/run.mjs'],{cwd:process.cwd(),env:{...process.env,...testEnv},stdio:'ignore'});
 await new Promise(r=>setTimeout(r,1500));
 const closed=new Promise(r=>child.once('close',r));stop(child);await closed;
 const dir=await mkdtemp(path.join(env.WEBFACTORY_BUILD_ROOT,'synthetic-'));
 await command('git',['init',dir],process.cwd());
 await command('git',['-C',dir,'checkout','-b','webfactory/build/synthetic-test'],process.cwd());
 assert.equal(await command('git',['-C',dir,'branch','--show-current'],process.cwd()),'webfactory/build/synthetic-test');
 console.log('PASS: private env, startup, authenticated polling, restart, shutdown, Chrome browser, isolated root and synthetic Git branch. Test directory retained; no customer build.');
}finally{server.close();}
