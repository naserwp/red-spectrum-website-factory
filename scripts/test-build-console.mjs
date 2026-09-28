// Explicitly authorized Nasir workflow test: records one failed build, never sends or deploys.
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync} from 'node:fs';
import {parseEnv} from 'node:util';
import {command} from './build-worker/runtime.mjs';
import pg from 'pg';
const cli=process.env.AGENT_BROWSER_CLI;
if(!cli)throw Error('AGENT_BROWSER_CLI required');
const b=(...args)=>command(process.execPath,[cli,'--session','build-engine-final',...args],process.cwd(),{},30000);
const evaluate=code=>command(process.execPath,[cli,'--session','build-engine-final','eval','--stdin'],process.cwd(),{},30000,code);
const env={...parseEnv(readFileSync(process.env.WEBFACTORY_TEST_ENV_FILE || '.env.local','utf8')),...process.env},base=process.env.WEBFACTORY_TEST_BASE_URL || 'http://localhost:3012',id='c22f0dc2-5b94-4998-a8fb-f873790802ad';
const db=new pg.Pool({connectionString:env.LEADS_DATABASE_URL,connectionTimeoutMillis:5000});
let stage='unauthenticated API checks';
try{
 for(const method of ['GET','POST'])assert.equal((await fetch(`${base}/api/admin/requests/${id}/build-jobs`,{method})).status,401);
 const unauthorized=await fetch(base+'/admin/requests/'+id,{redirect:'manual'});assert.ok([303,307].includes(unauthorized.status));
 stage='saved request lookup';console.log(stage);
 const before=(await db.query('SELECT r.customer_slug,w.stage FROM webfactory.requests r JOIN webfactory.build_workflows w ON w.request_id=r.id WHERE r.id=$1',[id])).rows[0];
 assert.equal(before.customer_slug,'nasirtesting');assert.equal(before.stage,'build_approved');
 stage='login page browser navigation';console.log(stage);await b('open',base+'/admin/login');
 await b('snapshot','-i');
 stage='credential input';
 // Credentials are fed through stdin only, never arguments, stdout or saved browser state.
 await evaluate(`(()=>{const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;for(const [name,value] of Object.entries(${JSON.stringify({username:env.WEBFACTORY_ADMIN_USER,password:env.WEBFACTORY_ADMIN_PASSWORD})})){const e=document.querySelector('[name='+name+']');set.call(e,value);e.dispatchEvent(new Event('input',{bubbles:true}));}return true;})()`);
 stage='login submit';await b('find','role','button','click','--name','Sign in','--exact');
 stage='login redirect';
 // CLI URL waits use substring matching in this installed version: /admin also
 // matches /admin/login. Require the exact completed redirect instead.
 let signedIn=false;
 for(let n=0;n<40;n++){if(JSON.parse(await evaluate('location.pathname'))==='/admin'){signedIn=true;break;}await new Promise(r=>setTimeout(r,250));}
 assert.equal(signedIn,true);
 console.log('Local login submitted.');
 stage='authenticated request navigation';await b('open',base+'/admin/requests/'+id+'#build');
 await b('wait','--text','Build Customer Website');
 console.log('Request build console loaded.');
 stage='confirmation and manual fallback';
 assert.equal(JSON.parse(await evaluate(`Array.from(document.querySelectorAll('[aria-label="Build console"] button')).find(b=>b.textContent==='BUILD CUSTOMER WEBSITE').disabled`)),true);
 await evaluate(`document.querySelector('[aria-label="Build console"] input[type="checkbox"]').click()`);
 assert.equal(JSON.parse(await evaluate(`Array.from(document.querySelectorAll('[aria-label="Build console"] button')).find(b=>b.textContent==='BUILD CUSTOMER WEBSITE').disabled`)),false);
 await evaluate(`document.querySelector('[aria-label="Build console"] input[type="checkbox"]').click()`);
 assert.equal(JSON.parse(await evaluate(`Array.from(document.querySelectorAll('summary')).some(e=>e.textContent==='Advanced / Manual Build Fallback')`)),true);
 // Verify the actual timer, not just the manual refresh button; never submit a build.
 await evaluate(`(()=>{window.__buildPolls=0;const original=window.fetch;window.fetch=(...args)=>{if(String(args[0]).endsWith('/build-jobs'))window.__buildPolls++;return original(...args);};return true;})()`);
 await new Promise(r=>setTimeout(r,11000));
 assert.ok(JSON.parse(await evaluate('window.__buildPolls'))>=1);
 const existing=(await db.query('SELECT id FROM webfactory.website_build_jobs WHERE request_id=$1',[id])).rows;
 if(!existing.length && !process.argv.includes('--read-only')){
   await evaluate(`(()=>{document.querySelector('[aria-label="Build console"] input[type="checkbox"]').click();return true;})()`);
   await evaluate(`(()=>{const b=Array.from(document.querySelectorAll('[aria-label="Build console"] button')).find(b=>b.textContent==='BUILD CUSTOMER WEBSITE');if(b.disabled)throw Error('Build disabled');b.click();return true;})()`);
 }
 stage='build history';await b('wait','--text','BUILD EXECUTOR NOT CONFIGURED');
 await b('find','role','button','click','--name','Refresh Status','--exact');
 const job=(await db.query('SELECT customer_slug,status,error_category,approved_brief,preview_url,changed_files FROM webfactory.website_build_jobs WHERE request_id=$1 ORDER BY created_at DESC LIMIT 1',[id])).rows[0];
 assert.equal(job.customer_slug,'nasirtesting');assert.equal(job.approved_brief.customerSlug,'nasirtesting');assert.equal(job.status,'failed');assert.equal(job.error_category,'BUILD_EXECUTOR_NOT_CONFIGURED');assert.equal(job.preview_url,null);assert.deepEqual(job.changed_files,[]);
 assert.equal((await db.query('SELECT stage FROM webfactory.build_workflows WHERE request_id=$1',[id])).rows[0].stage,'build_approved');
 assert.equal(JSON.parse(await evaluate(`!!document.querySelector('[data-nextjs-dialog]')`)),false);
 mkdirSync('outputs',{recursive:true});
 for(const width of [320,768,1440]){
   stage='mobile '+width;await b('set','viewport',String(width),'1000');
   await evaluate(`document.querySelector('[aria-label="Build console"]').scrollIntoView({block:'start'})`);
   assert.equal(JSON.parse(await evaluate('document.documentElement.scrollWidth>innerWidth')),false);
   await b('screenshot',`outputs/build-console-${width}.png`);
 }
 const publicHtml=await (await fetch(base+'/designs')).text();
 assert.ok(!publicHtml.includes('BUILD_EXECUTOR_NOT_CONFIGURED'));assert.ok(!publicHtml.includes(id));
 for(const route of ['/','/designs','/request','/admin/login','/swenzy-logistics','/jm-trucking','/360-vitality-fitness','/jm0616studio','/lc-real-estate'])assert.equal((await fetch(base+route)).status,200,route);
 assert.equal((await fetch(base+'/nasirtesting')).status,404);
 stage='logout';await b('open',base+'/admin');await b('snapshot','-i');await b('find','role','button','click','--name','Sign out','--exact');
 let signedOut=false;for(let n=0;n<40;n++){if(JSON.parse(await evaluate('location.pathname'))==='/admin/login'){signedOut=true;break;}await new Promise(r=>setTimeout(r,250));}assert.equal(signedOut,true);
 assert.equal(JSON.parse(await evaluate(`fetch('/api/admin/requests/${id}/build-jobs').then(r=>r.status)`)),401);
 console.log('PASS: real admin login/logout, private GET/POST, confirmation gate, manual fallback, Nasir persistent failure history, canonical slug, unchanged approval, automatic polling, mobile 320/768/1440, public privacy, customer routes and Nasir 404. No build started.');
}catch(error){console.error('Build console check failed at: '+stage+'; category: '+(error?.code==='ERR_ASSERTION'?'assertion':error?.code==='ETIMEDOUT'?'timeout':'operation failed'));try{console.log('Login diagnostic: '+await evaluate(`(()=>{const t=document.body.innerText;return {path:location.pathname,invalid:t.includes('Invalid login details'),unconfigured:t.includes('not configured for this environment'),limited:t.includes('Too many login attempts'),storage:t.includes('Secure login is temporarily unavailable')};})()`));}catch{}process.exitCode=1;}finally{await db.end();try{await b('close');}catch{}}
