import {command,cleanEnv,launch,stop,stopAll,assertRoot} from './runtime.mjs';
import {mkdir,readFile,lstat,realpath} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {runPipeline} from './pipeline.mjs';
import {generateDesign,writeCustomer,validateScope,verifyManifestDiff} from './generator.mjs';

const env=process.env;
const required=['WEBFACTORY_BUILD_CONTROL_URL','WEBFACTORY_BUILD_WORKER_SECRET','WEBFACTORY_BUILD_ROOT','WEBFACTORY_BUILD_BASE_SHA','OPENAI_API_KEY','AGENT_BROWSER_CLI'];
const missing=required.filter(k=>!env[k]);
if(missing.length){console.error('Missing configuration names: '+missing.join(', '));process.exit(1);}
if(Number(process.versions.node.split('.')[0])<24 || !/^[a-f0-9]{40}$/.test(env.WEBFACTORY_BUILD_BASE_SHA) || env.WEBFACTORY_BUILD_WORKER_SECRET.length<32){console.error('Requires Node 24, reviewed baseline SHA and strong worker secret.');process.exit(1);}
if(!env.VERCEL_TOKEN&&!env.VERCEL_CLI){console.error('Vercel CLI path or token required.');process.exit(1);}
const control=new URL(env.WEBFACTORY_BUILD_CONTROL_URL);
if(control.username || control.password || control.search || control.hash || (control.protocol!=='https:' && !(control.protocol==='http:' && ['localhost','127.0.0.1'].includes(control.hostname))))throw Error('Invalid control URL');
const root=path.resolve(env.WEBFACTORY_BUILD_ROOT);
assertRoot(root,process.cwd());
await mkdir(root,{recursive:true});
if((await lstat(root)).isSymbolicLink())throw Error('Worker root must not be a symlink');
assertRoot(await realpath(root),await realpath(process.cwd()));
const project='prj_HV68RI67tT0LXTfEA1mguG6F3Ddo',team='team_jaE4H8Ibm6itfUNg5ZrhI7Bi';
const workerId='worker-'+randomUUID();
let stopping=false;
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{stopping=true;stopAll();console.log('Worker stopping; unfinished leases expire safely.');process.exit(0);});
const api=async data=>{const r=await fetch(new URL('/api/internal/build-worker',control),{method:'POST',headers:{Authorization:`Bearer ${env.WEBFACTORY_BUILD_WORKER_SECRET}`,'Content-Type':'application/json'},body:JSON.stringify(data),signal:AbortSignal.timeout(80000)});if(!r.ok)throw Error('WORKER_INTERRUPTED');return r.json();};
const gitEnv={GIT_TERMINAL_PROMPT:'0',GCM_INTERACTIVE:'Never',...(env.GH_TOKEN?{GIT_CONFIG_COUNT:'1',GIT_CONFIG_KEY_0:'http.https://github.com/.extraheader',GIT_CONFIG_VALUE_0:'AUTHORIZATION: basic '+Buffer.from('x-access-token:'+env.GH_TOKEN).toString('base64')}:{})};
async function vercelGet(endpoint){
 if(!env.VERCEL_TOKEN)return JSON.parse(await command(process.execPath,[env.VERCEL_CLI,'api',endpoint],process.cwd(),{},30000));
 const r=await fetch('https://api.vercel.com'+endpoint,{headers:{Authorization:`Bearer ${env.VERCEL_TOKEN}`},signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('DEPLOYMENT_FAILED');return r.json();
}
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function pages(base,job,site){
 for(const page of ['','/services','/about','/contact','/privacy']){
  const response=await fetch(base+'/'+job.customerSlug+page,{redirect:'error',signal:AbortSignal.timeout(10000)});if(!response.ok)throw Error('PREVIEW_VERIFICATION_FAILED');
  const html=await response.text();
  const identity=[...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].some(m=>{try{const d=JSON.parse(m[1]);return d.name===site.business.name && d.url===`https://preview.redspectrum.ai/${job.customerSlug}`;}catch{return false;}});
  if(!identity || !html.includes('noindex') || !html.includes('<title>') || html.includes(job.requestId) || html.includes(job.briefId) || html.includes('BUILD_WORKER_SECRET'))throw Error('PREVIEW_VERIFICATION_FAILED');
 }
}
async function execute(job,lease){
 let cancelled=false,lost=false;const heartbeat=async()=>{try{cancelled=(await api({action:'heartbeat',jobId:job.id,lease})).cancelRequested;}catch{lost=true;}};
 const timer=setInterval(()=>void heartbeat(),20000);
 const check=async()=>{await heartbeat();if(cancelled || lost)throw Error('WORKER_INTERRUPTED');};
 const progress=stage=>api({action:'progress',jobId:job.id,lease,stage});
 const branch=`webfactory/build/${job.id}-${job.customerSlug}`;
 let baselineManifest;
 try{return await runPipeline(job,{
  check,progress,
  async checkout(){
   if(!/^[a-f0-9-]{36}$/.test(job.id) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(job.customerSlug))throw Error('SCOPE_REJECTED');
   const dir=path.join(root,job.id);if(path.dirname(dir)!==root)throw Error('SCOPE_REJECTED');
   await command('git',['clone','--no-checkout','https://github.com/naserwp/red-spectrum-website-factory.git',dir],root,gitEnv);
   await command('git',['checkout','-b',branch,env.WEBFACTORY_BUILD_BASE_SHA],dir);
   const baseline=(await command('git',['rev-parse','HEAD'],dir)).trim();if(baseline!==env.WEBFACTORY_BUILD_BASE_SHA)throw Error('SCOPE_REJECTED');
   if(await command('git',['status','--porcelain'],dir))throw Error('SCOPE_REJECTED');
   baselineManifest=JSON.parse(await readFile(path.join(dir,'customers/manifest.json'),'utf8'));
   return {dir,baseline};
  },
  generate:()=>generateDesign(job,env),
  apply:(repo,_job,design)=>writeCustomer(repo.dir,job,design),
  async validate(repo){
   const tracked=(await command('git',['diff','--name-only'],repo.dir)).split('\n').filter(Boolean),untracked=(await command('git',['ls-files','--others','--exclude-standard'],repo.dir)).split('\n').filter(Boolean),files=[...new Set([...tracked,...untracked])];
   validateScope(job.customerSlug,files);
   for(const file of files){if((await lstat(path.join(repo.dir,file))).isSymbolicLink())throw Error('SCOPE_REJECTED');const content=await readFile(path.join(repo.dir,file),'utf8');for(const [key,value] of Object.entries(env))if(/KEY|TOKEN|SECRET|PASSWORD/.test(key)&&value?.length>=8&&content.includes(value))throw Error('SCOPE_REJECTED');}
   verifyManifestDiff(baselineManifest,JSON.parse(await readFile(path.join(repo.dir,'customers/manifest.json'),'utf8')),job.customerSlug);return files;
  },
  async build(repo){
   await command('npm',['ci','--ignore-scripts','--no-audit','--no-fund'],repo.dir);
   try{await command('npm',['run','lint'],repo.dir);}catch{throw Error('LINT_FAILED');}
   try{await command('npm',['run','build'],repo.dir);}catch{throw Error('BUILD_FAILED');}
  },
  async qa(repo,_job,site){
   // Start production server without database, email, payment, admin or provider secrets.
   const port=43127,base=`http://127.0.0.1:${port}`;
   const server=launch(process.execPath,['node_modules/next/dist/bin/next','start','--port',String(port)],{cwd:repo.dir,env:cleanEnv,stdio:'ignore'});
   const browser=(...args)=>command(process.execPath,[env.AGENT_BROWSER_CLI,'--session','worker-'+job.id,...args],repo.dir,{...(env.AGENT_BROWSER_EXECUTABLE_PATH?{AGENT_BROWSER_EXECUTABLE_PATH:env.AGENT_BROWSER_EXECUTABLE_PATH}:{})},60000);
   try{
    let ready=false;for(let n=0;n<30;n++){await check();try{if((await fetch(base,{signal:AbortSignal.timeout(1000)})).ok){ready=true;break;}}catch{}await pause(1000);}if(!ready)throw Error('QA_FAILED');
    await pages(base,job,site);
    for(const page of ['','/services','/about','/contact','/privacy']){
     await browser('open',base+'/'+job.customerSlug+page);
     for(const width of [320,768,1440]){
      await browser('set','viewport',String(width),'1000');
      const checks=JSON.parse(await browser('eval',`({overflow:document.documentElement.scrollWidth>innerWidth,images:Array.from(document.images).every(i=>i.complete&&i.naturalWidth>0),leak:Array.from(document.querySelectorAll('a[href^="/"]')).some(a=>!a.getAttribute('href').startsWith('/${job.customerSlug}')),error:!!document.querySelector('[data-nextjs-dialog]')})`));
      if(checks.overflow || !checks.images || checks.leak || checks.error)throw Error('QA_FAILED');
     }
    }
    return {route_identity:true,required_pages:true,tenant_isolation:true,navigation:true,metadata:true,public_privacy:true,mobile_320_768_1440:true,lint:true,production_build:true};
   }catch{throw Error('QA_FAILED');}finally{try{await browser('close');}catch{}stop(server);}
  },
  async deploy(repo,_job,files){
   await check();validateScope(job.customerSlug,files);
   await command('git',['add','--',...files],repo.dir);
   await command('git',['-c','user.name=RS WebFactory Build Worker','-c','user.email=build-worker@users.noreply.github.com','commit','-m',`Build preview for ${job.customerSlug}`],repo.dir);
   const sha=await command('git',['rev-parse','HEAD'],repo.dir);await check();
   await command('git',['push','origin',`HEAD:refs/heads/${branch}`],repo.dir,gitEnv);
   // Reuse existing Git integration; never issue a second deployment or promote.
   for(let n=0;n<60;n++){
    await check();const result=await vercelGet(`/v7/deployments?projectId=${project}&teamId=${team}&sha=${sha}&limit=20`);
    const d=result.deployments?.find(d=>d.meta?.githubCommitSha===sha && d.target!=='production');
    if(d?.state==='ERROR' || d?.state==='CANCELED')throw Error('DEPLOYMENT_FAILED');
    if(d?.state==='READY' && /^[a-z0-9-]+\.vercel\.app$/.test(d.url))return {url:'https://'+d.url,reference:d.uid,sha};
    await pause(10000);
   }throw Error('DEPLOYMENT_FAILED');
  },
  verify:(deployment,_job,site)=>pages(deployment.url,job,site),
  async complete({repo,files,qa,deployment,provider}){await api({action:'complete',jobId:job.id,lease,baselineSha:repo.baseline,resultSha:deployment.sha,branch,changedFiles:files,qa,previewUrl:deployment.url+'/'+job.customerSlug,deploymentReference:deployment.reference,provider});},
  async fail(code){if(lost)return;try{await api(cancelled?{action:'cancel_ack',jobId:job.id,lease}:{action:'fail',jobId:job.id,lease,code:['PROVIDER_UNAVAILABLE','PROVIDER_FAILED','INVALID_OUTPUT','SCOPE_REJECTED','LINT_FAILED','BUILD_FAILED','QA_FAILED','DEPLOYMENT_FAILED','PREVIEW_VERIFICATION_FAILED','CONFIGURATION_MISSING'].includes(code)?code:'WORKER_INTERRUPTED'});}catch{}},
 });}finally{clearInterval(timer);}
}
// One job at a time; process supervisor restarts the poller. Never recover by force-pushing.
console.log('RS WebFactory Build Worker\nControl plane: configured\nGitHub: '+(env.GH_TOKEN?'token configured':'Windows/native credential manager')+'\nVercel: '+(env.VERCEL_TOKEN?'token configured':'existing CLI session'));
if(process.argv.includes('--check')){console.log('Configuration valid; no jobs claimed.');process.exit(0);}
console.log('Polling...');
while(!stopping){
 try{const {job,lease}=await api({action:'claim',workerId});if(job){await execute(job,lease);console.log('Build attempt finished; consult private job history.');}else {console.log('Waiting for build jobs...');if(!process.argv.includes('--once'))await pause(10000);}}catch{console.error('Worker paused: check private configuration/lease state.');if(!process.argv.includes('--once'))await pause(10000);}
 if(process.argv.includes('--once'))break;
}
