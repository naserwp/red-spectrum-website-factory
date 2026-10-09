import {command,stopAll,assertRoot} from './runtime.mjs';
import {mkdir,readFile,lstat,realpath} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {workerOptions,pollDelay} from './options.mjs';
import {compileWithRetry} from './build-retry.mjs';
import {runPipeline} from './pipeline.mjs';
import {generateDesign,writeCustomer,validateScope,verifyManifestDiff} from './generator.mjs';
import {runQa} from './qa.mjs';
import {saveCheckpoint,loadCheckpoint} from './checkpoint.mjs';
import {verifyProtectedPreview} from '../../lib/webfactory/preview-verification.ts';

const env=process.env;
const options=workerOptions(process.argv.slice(2));
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
 return verifyProtectedPreview({previewUrl:base.url+'/'+job.customerSlug,deploymentReference:base.reference,resultSha:base.sha,slug:job.customerSlug,business:site.business.name},{apiGet:vercelGet,privateValues:[job.id,job.requestId,job.briefId]});
}
async function execute(job,lease){
 if(!Number.isSafeInteger(job.runAttempt??0)||(job.runAttempt??0)<0||(job.runAttempt??0)>3)throw Error('SCOPE_REJECTED');
 const jobDirectory=path.join(root,job.id+(job.runAttempt?'-attempt-'+job.runAttempt:''));
 let cancelled=false,lost=false;const heartbeat=async()=>{try{cancelled=(await api({action:'heartbeat',jobId:job.id,lease})).cancelRequested;}catch{lost=true;}};
 const timer=setInterval(()=>void heartbeat(),20000);
 const check=async()=>{await heartbeat();if(cancelled || lost)throw Error('WORKER_INTERRUPTED');};
 const progress=async stage=>{const result=await api({action:'progress',jobId:job.id,lease,stage});console.log(JSON.stringify({event:'stage',jobId:job.id,stage,at:new Date().toISOString()}));return result;};
 const branch=`webfactory/build/${job.id}-${job.customerSlug}`;
 let baselineManifest,checkpointMetadata;
 try{return await runPipeline(job,{
  check,progress,
  async resumePreview(){
   const dir=jobDirectory,c=await loadCheckpoint(dir,job),saved=job.previewRecovery;
   if(!saved||saved.artifactSha!==c.artifactSha||!saved.qa||Object.values(saved.qa).some(v=>v!==true)||await command('git',['branch','--show-current'],dir)!==branch||await command('git',['rev-parse','HEAD'],dir)!==saved.deployment.sha||await command('git',['status','--porcelain'],dir))throw Error('SCOPE_REJECTED');
   const parent=job.previousResultSha?'HEAD^1^':'HEAD^';
   if(await command('git',['rev-parse',parent],dir)!==c.baseline)throw Error('SCOPE_REJECTED');
   if(job.previousResultSha&&await command('git',['rev-parse','HEAD^2'],dir)!==job.previousResultSha)throw Error('SCOPE_REJECTED');
   const changed=(await command('git',['diff','--name-only',c.baseline,'HEAD'],dir)).split('\n').filter(Boolean).sort();
   validateScope(job.customerSlug,changed);if(JSON.stringify(changed)!==JSON.stringify([...c.files].sort()))throw Error('SCOPE_REJECTED');
   const site=JSON.parse(await readFile(path.join(dir,`customers/${job.customerSlug}/site/customer.config.json`),'utf8'));
   return {repo:{dir,baseline:c.baseline},files:c.files,qa:saved.qa,deployment:saved.deployment,provider:c.provider,site};
  },
  async checkpoint(repo,_job,files,provider){
   const c=await saveCheckpoint(repo,job,files,provider);
   checkpointMetadata={artifactSha:c.artifactSha,baselineSha:c.baseline,provider:c.provider};
   await api({action:'qa_checkpoint',jobId:job.id,lease,artifactSha:c.artifactSha,baselineSha:repo.baseline,provider});
  },
  async resume(){
   const dir=jobDirectory,c=await loadCheckpoint(dir,job);
   checkpointMetadata=job.checkpoint;
   if(await command('git',['branch','--show-current'],dir)!==branch||await command('git',['rev-parse','HEAD'],dir)!==c.baseline)throw Error('SCOPE_REJECTED');
   validateScope(job.customerSlug,c.files);
   const site=JSON.parse(await readFile(path.join(dir,`customers/${job.customerSlug}/site/customer.config.json`),'utf8'));
   return {repo:{dir,baseline:c.baseline},design:{provider:c.provider},site,files:c.files};
  },
  async checkout(){
   if(!/^[a-f0-9-]{36}$/.test(job.id) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(job.customerSlug))throw Error('SCOPE_REJECTED');
   const dir=jobDirectory;if(path.dirname(dir)!==root)throw Error('SCOPE_REJECTED');
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
   try{await command('npm',['run','lint'],repo.dir);}catch(e){throw Object.assign(Error('LINT_FAILED'),{commandFailure:e.commandFailure});}
   try{await compileWithRetry(()=>command('npm',['run','build'],repo.dir),check,{onRetry:reason=>console.log(JSON.stringify({event:'local_build_retry',jobId:job.id,reason,at:new Date().toISOString()}))});}catch(e){throw Object.assign(Error('BUILD_FAILED'),{commandFailure:e.commandFailure});}
  },
  async qa(repo,_job,site){
   const qa=await runQa(repo,job,site,env,check);
   await api({action:'qa_report',jobId:job.id,lease,diagnostics:qa.results});
   return qa.checks;
  },
  async deploy(repo,_job,files){
   await check();validateScope(job.customerSlug,files);
   await loadCheckpoint(repo.dir,{...job,checkpoint:checkpointMetadata});
   await command('git',['add','--',...files],repo.dir);
   await command('git',['-c','user.name=RS WebFactory Build Worker','-c','user.email=build-worker@users.noreply.github.com','commit','-m',`Build preview for ${job.customerSlug}`],repo.dir);
   if(job.previousResultSha){
    if(!/^[a-f0-9]{40}$/.test(job.previousResultSha))throw Error('SCOPE_REJECTED');
    await command('git',['fetch','origin','refs/heads/'+branch],repo.dir,gitEnv);
    if(await command('git',['rev-parse','FETCH_HEAD'],repo.dir)!==job.previousResultSha)throw Error('SCOPE_REJECTED');
    // Retain the prior deployment in ancestry without accepting its old tree.
    await command('git',['-c','user.name=RS WebFactory Build Worker','-c','user.email=build-worker@users.noreply.github.com','merge','-s','ours','--no-ff','--no-edit',job.previousResultSha],repo.dir);
   }
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
  verify:(deployment,_job,site)=>pages(deployment,job,site),
  async complete({repo,files,qa,deployment,provider}){await api({action:'complete',jobId:job.id,lease,baselineSha:repo.baseline,resultSha:deployment.sha,branch,changedFiles:files,qa,previewUrl:deployment.url+'/'+job.customerSlug,deploymentReference:deployment.reference,provider});},
  async fail(code,diagnostics,commandFailure){if(lost)return;try{await api(cancelled?{action:'cancel_ack',jobId:job.id,lease}:{action:'fail',jobId:job.id,lease,...(diagnostics?{diagnostics}:{}),...(commandFailure?{commandFailure}:{}),code:['PROVIDER_UNAVAILABLE','PROVIDER_QUOTA_EXHAUSTED','PROVIDER_FAILED','INVALID_OUTPUT','SCOPE_REJECTED','LINT_FAILED','BUILD_FAILED','QA_FAILED','DEPLOYMENT_FAILED','PREVIEW_VERIFICATION_FAILED','CONFIGURATION_MISSING'].includes(code)?code:'WORKER_INTERRUPTED'});}catch{}},
 });}finally{clearInterval(timer);}
}
// One job at a time; process supervisor restarts the poller. Never recover by force-pushing.
console.log('RS WebFactory Build Worker\nControl plane: configured\nGitHub: '+(env.GH_TOKEN?'token configured':'Windows/native credential manager')+'\nVercel: '+(env.VERCEL_TOKEN?'token configured':'existing CLI session'));
if(options.check){console.log('Configuration valid; no jobs claimed.');process.exit(0);}
console.log('Polling...');
// Opt-in during rollout: older control planes do not implement the pulse action.
const pulse=()=>api({action:'pulse',workerId}).catch(()=>console.error(JSON.stringify({event:'health_report_failed',at:new Date().toISOString()})));
const healthTimer=env.WEBFACTORY_BUILD_HEALTH_ENABLED==='true'?setInterval(()=>void pulse(),30000):null;
if(healthTimer)await pulse();
let pollFailures=0;
while(!stopping){
 try{
  const {job,lease}=await api({action:'claim',workerId,...(options.jobId?{jobId:options.jobId}:{})});pollFailures=0;
  if(job){
   const status=await execute(job,lease);
   console.log(JSON.stringify({event:'attempt_finished',jobId:job.id,status,at:new Date().toISOString()}));
   if(options.once&&status!=='ready_for_review')process.exitCode=1;
  }else if(options.jobId){console.error('Target job was not claimable; no other job claimed.');process.exitCode=2;}
  else if(!options.once)await pause(10000);
 }catch{
  const delay=pollDelay(++pollFailures);
  console.error(JSON.stringify({event:'poll_failed',attempt:pollFailures,retryAfterMs:delay,at:new Date().toISOString()}));
  if(options.once)process.exitCode=1;else await pause(delay);
 }
 if(options.once)break;
}
if(healthTimer)clearInterval(healthTimer);
