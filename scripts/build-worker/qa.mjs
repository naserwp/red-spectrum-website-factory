import {command,cleanEnv,launch,stop} from './runtime.mjs';
import {createServer} from 'node:net';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {qaMessages} from '../../lib/webfactory/qa-diagnostics.ts';
export class QaFailure extends Error {
 constructor(results){super('QA_FAILED');this.results=results;}
}
export function recorder(){
 const results=[];
 return {results,assert(name,ok,page='',viewport=0,start=Date.now()){
  results.push({check_name:name,status:ok?'passed':'failed',page,viewport,duration:Math.max(0,Date.now()-start),timestamp:new Date().toISOString()});
  if(!ok)throw new QaFailure([...results]);
 }};
}
export function checkHtml(record,html,status,job,site,page){
 record.assert('customer-route',status===200,page);
 const identity=[...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].some(m=>{try{const d=JSON.parse(m[1]);return d.name===site.business.name&&d.url===`https://preview.redspectrum.ai/${job.customerSlug}`;}catch{return false;}});
 record.assert('customer-identity',identity,page);
 record.assert('metadata',html.includes('noindex')&&html.includes('<title>'),page);
 record.assert('privacy',![job.requestId,job.briefId,'BUILD_WORKER_SECRET','LEADS_DATABASE_URL','OPENAI_API_KEY'].filter(Boolean).some(s=>html.includes(s)),page);
}
export function checkBrowser(record,c,page,width){
 for(const [name,ok] of [['mobile-overflow',!c.overflow],['images',c.images],['tenant-isolation',!c.leak],['page-error',!c.error]])record.assert(name,ok,page,width);
}
export async function browserStep(record,fn,page,width,name){
 const start=Date.now();try{return await fn();}catch(error){record.assert(error?.code==='COMMAND_TIMEOUT'?'browser-timeout':name,false,page,width,start);}
}
export function safeResults(results){return results.map(r=>({...r,safe_message:r.status==='failed'?qaMessages[r.check_name]:'Check passed.'}));}
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function freePort(){const s=createServer();await new Promise((resolve,reject)=>{s.once('error',reject);s.listen(0,'127.0.0.1',resolve);});const port=s.address().port;await new Promise(r=>s.close(r));return port;}
export async function runQa(repo,job,site,env,check=async()=>{}){
 const record=recorder(),port=await freePort(),base=`http://127.0.0.1:${port}`;
 const server=launch(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{cwd:repo.dir,env:cleanEnv,stdio:'ignore'});
 let launchFailed=false;server.on('error',()=>{launchFailed=true;});
 const browser=(...args)=>command(process.execPath,[env.AGENT_BROWSER_CLI,'--session','qa-'+job.id,...args],repo.dir,{...(env.AGENT_BROWSER_EXECUTABLE_PATH?{AGENT_BROWSER_EXECUTABLE_PATH:env.AGENT_BROWSER_EXECUTABLE_PATH}:{})},45000);
 try{
  record.assert('privacy',site.form?.mode==='disabled'&&site.myndy?.embed?.enabled===false);
  const manifest=JSON.parse(await readFile(path.join(repo.dir,'customers/manifest.json'),'utf8'));
  const otherNames=manifest.customers.filter(c=>c.slug!==job.customerSlug).map(c=>c.business.name);
  const start=Date.now();let ready=false;
  for(let n=0;n<30;n++){await check();if(launchFailed||server.exitCode!==null)break;try{if((await fetch(base,{signal:AbortSignal.timeout(1000)})).ok){ready=true;break;}}catch{}await pause(1000);}
  record.assert('server-start',ready,'',0,start);
  for(const page of ['','/services','/about','/contact','/privacy']){
   await check();let response;try{response=await fetch(base+'/'+job.customerSlug+page,{redirect:'error',signal:AbortSignal.timeout(10000)});}catch{record.assert('customer-route',false,page);}
   const html=await response.text();checkHtml(record,html,response.status,job,site,page);
   record.assert('tenant-isolation',!otherNames.some(name=>html.includes(name)),page);
   await browserStep(record,()=>browser('open',base+'/'+job.customerSlug+page),page,0,'browser-launch');
   await browserStep(record,()=>browser('snapshot','-i'),page,0,'browser-check');
   for(const width of (site.design?.version==='2.0'?[320,375,768,1024,1440,1920]:[320,768,1440])){
    await browserStep(record,()=>browser('set','viewport',String(width),'1000'),page,width,'browser-check');
    // Wait for image completion, then assert success; do not conceal broken images.
    await browserStep(record,()=>browser('eval',`Promise.all([...document.images].map(i=>i.complete?Promise.resolve():new Promise(r=>{i.addEventListener('load',r,{once:true});i.addEventListener('error',r,{once:true});setTimeout(r,5000)}))).then(()=>true)`),page,width,'browser-check');
    const c=await browserStep(record,async()=>JSON.parse(await browser('eval',`({overflow:document.documentElement.scrollWidth>innerWidth,images:[...document.images].every(i=>i.complete&&i.naturalWidth>0),leak:[...document.querySelectorAll('a[href^="/"]')].some(a=>{const p=a.getAttribute('href').split(/[?#]/)[0];return p!=='/${job.customerSlug}'&&!p.startsWith('/${job.customerSlug}/')}),error:!!document.querySelector('[data-nextjs-dialog]')})`)),page,width,'browser-check');
    checkBrowser(record,c,page,width);
    if(width===320){
     const menu=await browserStep(record,()=>browser('eval',`(()=>{const d=document.querySelector('header details');if(!d)return false;d.open=true;return true})()`),page,width,'browser-check');
     if(JSON.parse(menu)){
      record.assert('mobile-overflow',!JSON.parse(await browser('eval','document.documentElement.scrollWidth>innerWidth')),page,width);
      await browserStep(record,()=>browser('eval',`document.querySelector('header details').open=false`),page,width,'browser-check');
     }
    }
   }
  }
  return {checks:{route_identity:true,required_pages:true,tenant_isolation:true,navigation:true,metadata:true,public_privacy:true,mobile_320_768_1440:true,lint:true,production_build:true},results:record.results};
 }finally{try{await browser('close');}catch{}stop(server);}
}
