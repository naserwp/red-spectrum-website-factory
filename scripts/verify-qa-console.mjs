// Read-only browser verification; never clicks build or retry.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseEnv} from 'node:util';
import {command} from './build-worker/runtime.mjs';
const env=parseEnv(await readFile('.env.local','utf8')),w=parseEnv(await readFile('.env.worker.local','utf8'));
const base=process.env.WEBFACTORY_TEST_BASE_URL||'http://localhost:3015',id='c22f0dc2-5b94-4998-a8fb-f873790802ad',jobId='87d75333-6525-406c-82dd-b4591833c2b3';
const args=[w.AGENT_BROWSER_CLI,'--session','qa-console-readonly'];
const browser=(...a)=>command(process.execPath,[...args,...a],process.cwd(),{AGENT_BROWSER_EXECUTABLE_PATH:w.AGENT_BROWSER_EXECUTABLE_PATH},45000);
const evaluate=s=>command(process.execPath,[...args,'eval','--stdin'],process.cwd(),{},30000,s);
let stage='auth';try{
 for(const method of ['GET','POST'])assert.equal((await fetch(base+'/api/admin/requests/'+id+'/build-jobs',{method})).status,401);
 assert([303,307].includes((await fetch(base+'/admin/requests/'+id,{redirect:'manual'})).status));
 await browser('open',base+'/admin/login');await browser('snapshot','-i');
 await evaluate(`(()=>{const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;for(const [name,value] of Object.entries(${JSON.stringify({username:env.WEBFACTORY_ADMIN_USER,password:env.WEBFACTORY_ADMIN_PASSWORD})})){const e=document.querySelector('[name='+name+']');set.call(e,value);e.dispatchEvent(new Event('input',{bubbles:true}));}return true;})()`);
 await browser('find','role','button','click','--name','Sign in','--exact');let ready=false;
 for(let i=0;i<40;i++){if(JSON.parse(await evaluate('location.pathname'))==='/admin'){ready=true;break;}await new Promise(r=>setTimeout(r,250));}assert(ready);
 stage='diagnostic UI';await browser('open',base+'/admin/requests/'+id);await browser('wait','--text','Failed stage: QA');await browser('snapshot','-i');
 assert.equal(JSON.parse(await evaluate(`document.querySelector('[aria-label="Build console"]').innerText.includes('mobile-overflow')`)),true);
 const history=JSON.parse(await evaluate(`fetch('/api/admin/requests/${id}/build-jobs').then(r=>r.json())`));
 const j=history.jobs.find(j=>j.id===jobId);assert.equal(j.status,'failed');assert.equal(j.qaRetryAvailable,false);assert.equal(j.qa_result.attempts.at(-1).results.at(-1).check_name,'mobile-overflow');
 assert.equal(JSON.parse(await evaluate(`[...document.querySelectorAll('[aria-label="Build console"] button')].some(b=>b.textContent==='Cancel Build')`)),false);
 await evaluate(`[...document.querySelectorAll('[aria-label="Build console"] details')].filter(d=>d.querySelector('summary')?.textContent==='View QA Results').forEach(d=>d.open=true)`);
 for(const width of [320,768,1440]){await browser('set','viewport',String(width),'1000');assert.equal(JSON.parse(await evaluate('document.documentElement.scrollWidth>innerWidth')),false);}
 stage='public routes';for(const route of ['/','/designs','/request','/admin/login','/swenzy-logistics','/jm-trucking','/360-vitality-fitness','/jm0616studio','/lc-real-estate'])assert.equal((await fetch(base+route)).status,200);
 const html=await (await fetch(base+'/designs')).text();for(const privateValue of [id,jobId,'mobile-overflow','preserved_artifact_diagnosis'])assert(!html.includes(privateValue));
 assert.equal((await fetch(base+'/nasirtesting')).status,404);
 console.log('PASS: admin auth, actionable QA diagnostics, unavailable legacy retry, no terminal Cancel action, open results mobile 320/768/1440, public privacy and existing routes. No job created/retried.');
}catch{console.error('QA console verification failed at '+stage);process.exitCode=1;}finally{try{await browser('close');}catch{}}
