// Read-only admin gate check. Never clicks any approval or build button.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseEnv} from 'node:util';
import {command} from './build-worker/runtime.mjs';
const env=parseEnv(await readFile('.env.local','utf8')),worker=parseEnv(await readFile('.env.worker.local','utf8'));
const base=process.env.WEBFACTORY_TEST_BASE_URL||'https://red-spectrum-website-factory.vercel.app',id='c22f0dc2-5b94-4998-a8fb-f873790802ad';
const args=[worker.AGENT_BROWSER_CLI,'--session','approval-gate-readonly'];
const browser=(...a)=>command(process.execPath,[...args,...a],process.cwd(),{AGENT_BROWSER_EXECUTABLE_PATH:worker.AGENT_BROWSER_EXECUTABLE_PATH},60000);
const evaluate=s=>command(process.execPath,[...args,'eval','--stdin'],process.cwd(),{},30000,s);
try{
 assert.equal((await fetch(`${base}/api/admin/requests/${id}/build`,{method:'POST'})).status,401);
 await browser('open',base+'/admin/login');await browser('snapshot','-i');
 await evaluate(`(()=>{const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;for(const [name,value] of Object.entries(${JSON.stringify({username:env.WEBFACTORY_ADMIN_USER,password:env.WEBFACTORY_ADMIN_PASSWORD})})){const e=document.querySelector('[name='+name+']');set.call(e,value);e.dispatchEvent(new Event('input',{bubbles:true}));}return true})()`);
 await browser('find','role','button','click','--name','Sign in','--exact');
 let login=false;for(let i=0;i<40;i++){if(JSON.parse(await evaluate('location.pathname'))==='/admin'){login=true;break;}await new Promise(r=>setTimeout(r,250));}assert(login);
 await browser('open',base+'/admin/requests/'+id);await browser('snapshot','-i');
 const inspect=`(()=>{const p=document.querySelector('.wf-build-handoff'),find=s=>[...p.querySelectorAll('button')].find(b=>b.textContent===s);return {previewDisabled:find('Mark Preview Ready')?.disabled,customerDisabled:find('Mark Customer Approved')?.disabled,manualBuiltVisible:!!find('Verify Website Built'),verified:p.innerText.includes('Website Built: Verified'),pending:p.innerText.includes('Build pending'),url:[...p.querySelectorAll('input[type=url]')][0]?.value}})()`;
 const before=JSON.parse(await evaluate(inspect));
 await evaluate(`(()=>{document.querySelector('.wf-build-handoff > label.wf-check input').click();return true})()`);
 const after=JSON.parse(await evaluate(inspect));
 await evaluate(`(()=>{document.querySelector('.wf-build-handoff > label.wf-check input').click();return true})()`);
 console.log(JSON.stringify({before,after}));
 if(!process.argv.includes('--diagnose')){
  assert(before.previewDisabled);assert.equal(after.previewDisabled,false);assert(after.customerDisabled);assert(after.verified);assert.equal(after.pending,false);assert.equal(after.manualBuiltVisible,false);
  assert.equal(after.url,'https://red-spectrum-website-factory-o8uvnnyk4-naserwps-projects.vercel.app/nasirtesting');
  for(const width of [320,768,1440]){await browser('set','viewport',String(width),'1000');assert.equal(JSON.parse(await evaluate('document.documentElement.scrollWidth>innerWidth')),false);}
  console.log('PASS: built complete, confirmation required, Preview Ready enabled after confirmation, Customer Approved locked, correct protected URL, mobile 320/768/1440. No approval submitted.');
 }
}catch{console.error('Approval gate verification did not pass. No approval submitted.');process.exitCode=1;}finally{try{await browser('close');}catch{}}
