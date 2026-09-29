import {command,stopAll,assertRoot} from './runtime.mjs';
import {mkdir,readFile,lstat,realpath} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {runPipeline} from './pipeline.mjs';
import {batches} from './evidence-batches.mjs';
import {generateDesign,writeCustomer,validateScope,verifyManifestDiff} from './generator.mjs';
import {runQa} from './qa.mjs';
import {saveCheckpoint,loadCheckpoint} from './checkpoint.mjs';
import {verifyProtectedPreview} from '../../lib/webfactory/preview-verification.ts';

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
// The control plane refuses a worker request body over 24 kB, and a full
// five-page, six-width sweep plus accessibility audits records more QA evidence
// than that. An oversized body is rejected before the revision can record its own
// outcome, which loses an otherwise clean build. Evidence is therefore sent as
// ordered, byte-budgeted batches the control plane validates and appends
// individually: nothing is dropped, and a batch that contains a failure is still
// refused by the control plane exactly as before.
async function reportQaEvidence(jobId,lease,diagnostics){
 for(const batch of batches(diagnostics))await api({action:'qa_report',jobId,lease,diagnostics:batch});
}
async function pages(base,job,site){
 return verifyProtectedPreview({previewUrl:base.url+'/'+job.customerSlug,deploymentReference:base.reference,resultSha:base.sha,slug:job.customerSlug,business:site.business.name},{apiGet:vercelGet,privateValues:[job.id,job.requestId,job.briefId]});
}
async function execute(job,lease){
 let cancelled=false,lost=false;const heartbeat=async()=>{try{cancelled=(await api({action:'heartbeat',jobId:job.id,lease})).cancelRequested;}catch{lost=true;}};
 const timer=setInterval(()=>void heartbeat(),20000);
 const check=async()=>{await heartbeat();if(cancelled || lost)throw Error('WORKER_INTERRUPTED');};
 const progress=stage=>api({action:'progress',jobId:job.id,lease,stage});
 const branch=`webfactory/build/${job.id}-${job.customerSlug}`;
 let baselineManifest,checkpointMetadata;
 try{return await runPipeline(job,{
  check,progress,
  async resumePreview(){
   const dir=path.join(root,job.id),c=await loadCheckpoint(dir,job),saved=job.previewRecovery;
   if(!saved||saved.artifactSha!==c.artifactSha||!saved.qa||Object.values(saved.qa).some(v=>v!==true)||await command('git',['branch','--show-current'],dir)!==branch||await command('git',['rev-parse','HEAD'],dir)!==saved.deployment.sha||await command('git',['status','--porcelain'],dir))throw Error('SCOPE_REJECTED');
   if(await command('git',['rev-parse','HEAD^'],dir)!==c.baseline)throw Error('SCOPE_REJECTED');
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
   const dir=path.join(root,job.id),c=await loadCheckpoint(dir,job);
   checkpointMetadata=job.checkpoint;
   if(await command('git',['branch','--show-current'],dir)!==branch||await command('git',['rev-parse','HEAD'],dir)!==c.baseline)throw Error('SCOPE_REJECTED');
   validateScope(job.customerSlug,c.files);
   const site=JSON.parse(await readFile(path.join(dir,`customers/${job.customerSlug}/site/customer.config.json`),'utf8'));
   return {repo:{dir,baseline:c.baseline},design:{provider:c.provider},site,files:c.files};
  },
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
   try{await command('npm',['run','lint'],repo.dir);}catch(e){throw Object.assign(Error('LINT_FAILED'),{commandFailure:e.commandFailure});}
   try{await command('npm',['run','build'],repo.dir);}catch(e){throw Object.assign(Error('BUILD_FAILED'),{commandFailure:e.commandFailure});}
  },
  async qa(repo,_job,site){
   const qa=await runQa(repo,job,site,env,check);
   await reportQaEvidence(job.id,lease,qa.results);
   return qa.checks;
  },
  async deploy(repo,_job,files){
   await check();validateScope(job.customerSlug,files);
   await loadCheckpoint(repo.dir,{...job,checkpoint:checkpointMetadata});
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
  verify:(deployment,_job,site)=>pages(deployment,job,site),
  async complete({repo,files,qa,deployment,provider}){await api({action:'complete',jobId:job.id,lease,baselineSha:repo.baseline,resultSha:deployment.sha,branch,changedFiles:files,qa,previewUrl:deployment.url+'/'+job.customerSlug,deploymentReference:deployment.reference,provider});},
  async fail(code,diagnostics,commandFailure){if(lost)return;try{const groups=diagnostics?batches(diagnostics):[],last=groups.pop();if(diagnostics)for(const batch of groups)await api({action:'qa_report',jobId:job.id,lease,diagnostics:batch});await api(cancelled?{action:'cancel_ack',jobId:job.id,lease}:{action:'fail',jobId:job.id,lease,...(last?{diagnostics:last}:{}),...(commandFailure?{commandFailure}:{}),code:['PROVIDER_UNAVAILABLE','PROVIDER_FAILED','INVALID_OUTPUT','SCOPE_REJECTED','LINT_FAILED','BUILD_FAILED','QA_FAILED','DEPLOYMENT_FAILED','PREVIEW_VERIFICATION_FAILED','CONFIGURATION_MISSING'].includes(code)?code:'WORKER_INTERRUPTED'});}catch{}},
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
