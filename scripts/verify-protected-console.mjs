// Browser-only fixture by default; --live checks the persisted recovered job.
// No POST except admin login. No build/retry/approval click.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseEnv} from 'node:util';
import {command} from './build-worker/runtime.mjs';
const env=parseEnv(await readFile('.env.local','utf8')),w=parseEnv(await readFile('.env.worker.local','utf8'));
const base=process.env.WEBFACTORY_TEST_BASE_URL||'http://localhost:3015',id='c22f0dc2-5b94-4998-a8fb-f873790802ad',jobId='be19fdd6-cd63-4313-9c75-c8c187486024';
const preview='https://red-spectrum-website-factory-o8uvnnyk4-naserwps-projects.vercel.app/nasirtesting';
const args=[w.AGENT_BROWSER_CLI,'--session','protected-console'];
const browser=(...a)=>command(process.execPath,[...args,...a],process.cwd(),{AGENT_BROWSER_EXECUTABLE_PATH:w.AGENT_BROWSER_EXECUTABLE_PATH},45000);
const evaluate=code=>command(process.execPath,[...args,'eval','--stdin'],process.cwd(),{},30000,code);
try{
 for(const method of ['GET','POST'])assert.equal((await fetch(`${base}/api/admin/requests/${id}/build-jobs`,{method})).status,401);
 assert([303,307].includes((await fetch(base+'/admin/requests/'+id,{redirect:'manual'})).status));
 await browser('open',base+'/admin/login');await browser('snapshot','-i');
 await evaluate(`(()=>{const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;for(const [name,value] of Object.entries(${JSON.stringify({username:env.WEBFACTORY_ADMIN_USER,password:env.WEBFACTORY_ADMIN_PASSWORD})})){const e=document.querySelector('[name='+name+']');set.call(e,value);e.dispatchEvent(new Event('input',{bubbles:true}));}return true})()`);
 await browser('find','role','button','click','--name','Sign in','--exact');
 let login=false;for(let n=0;n<40;n++){if(JSON.parse(await evaluate('location.pathname'))==='/admin'){login=true;break;}await new Promise(r=>setTimeout(r,250));}assert(login);
 await browser('open',base+'/admin/requests/'+id);await browser('snapshot','-i');
 if(!process.argv.includes('--live')){
  await evaluate(`(()=>{const original=window.fetch.bind(window);window.fetch=async(...a)=>{const r=await original(...a);if(String(a[0]).endsWith('/build-jobs')&&!a[1]?.method){const data=await r.json();data.jobs=data.jobs.map(j=>j.id===${JSON.stringify(jobId)}?{...j,status:'ready_for_review',error_category:null,preview_url:${JSON.stringify(preview)},qa_result:{...j.qa_result,preview_access:{preview_public_access:'protected'}}}:j);return new Response(JSON.stringify(data),{status:r.status})}return r};return true})()`);
 }
 await browser('find','role','button','click','--name','Refresh Status','--exact');await browser('wait','--text','Preview protection:');
 const safe=JSON.parse(await evaluate(`(()=>{const section=document.querySelector('[aria-label="Build console"]');const link=[...section.querySelectorAll('a')].find(a=>a.textContent==='Open Preview');return {protected:section.innerText.includes('Protected'),signin:section.innerText.includes('authorized Vercel account'),href:link?.href}})()`));
 assert(safe.protected&&safe.signin);assert.equal(safe.href,preview);assert(!safe.href.includes('?'));
 for(const width of [320,768,1440]){await browser('set','viewport',String(width),'1000');assert.equal(JSON.parse(await evaluate('document.documentElement.scrollWidth>innerWidth')),false);}
 const publicHtml=await (await fetch(base+'/designs')).text();for(const value of [id,jobId,'preview_authenticated_access_verified','same_artifact_same_deployment_recovery'])assert(!publicHtml.includes(value));
 console.log('PASS: protected-preview Open Preview link, Vercel sign-in guidance, no credential URL, admin auth, public privacy, mobile 320/768/1440. No job mutation.');
}catch{console.error('Protected admin console verification failed.');process.exitCode=1;}finally{try{await browser('close');}catch{}}
