import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {parseEnv} from 'node:util';
const cli=process.env.AGENT_BROWSER_CLI,base=process.env.DESIGNS_TEST_BASE_URL || 'http://localhost:3012';
const browser=(...args)=>{try{return execFileSync(process.execPath,[cli,'--session','designs-qa',...args],{encoding:'utf8',timeout:60000});}catch{throw Error('Browser check failed (command details suppressed).');}};
for(const route of ['/','/designs','/request','/processing','/admin/login','/swenzy-logistics','/jm-trucking','/360-vitality-fitness','/jm0616studio'])assert.equal((await fetch(base+route)).status,200,route);
for(const route of ['/admin','/admin/ai','/admin/requests/c22f0dc2-5b94-4998-a8fb-f873790802ad'])assert.equal((await fetch(base+route,{redirect:'manual'})).status,307);
const response=await fetch(base+'/designs'),html=await response.text();
for(const value of ['requestHref','actionCount','/admin/requests/','customer_slug','access_hash','admin_session_hash'])assert.ok(!html.includes(value),'Public response leaked '+value);
assert.match(response.headers.get('cache-control'),/private|no-store/);
browser('open',base+'/designs');
assert.ok(JSON.parse(browser('eval',`!!document.querySelector('[data-preview-slug="jm0616studio"] a') && !document.querySelector('[data-preview-slug="nasirtesting"] a') && !document.querySelector('.wf-preview-admin')`)));
for(const width of [320,768,1440]){
  browser('set','viewport',String(width),'1000');
  browser('eval',`window.scrollTo({top:document.querySelector('.wf-preview-section').getBoundingClientRect().top+scrollY-30,behavior:'instant'})`);
  assert.equal(JSON.parse(browser('eval','document.documentElement.scrollWidth>innerWidth')),false);
  browser('screenshot',`outputs/designs-${width}.png`);
}
browser('find','label','Search business or slug','fill','nasirtesting');
assert.equal(JSON.parse(browser('eval',`document.querySelectorAll('.wf-preview-card').length`)),1);
browser('find','label','Search business or slug','fill','no-such-customer-qa');
assert.ok(JSON.parse(browser('eval',`!!document.querySelector('.wf-preview-empty')`)));
browser('find','label','Search business or slug','fill','');
browser('eval',`document.querySelector('.wf-preview-filters').scrollIntoView({block:'center'})`);
browser('find','role','button','click','--name','Preview Ready','--exact');
assert.ok(JSON.parse(browser('eval',`Array.from(document.querySelectorAll('.wf-preview-status')).every(e=>e.textContent==='preview ready')`)));
browser('open',base+'/admin/login');
const env=parseEnv(readFileSync('.env.production.local','utf8'));
browser('find','label','Username','fill',env.WEBFACTORY_ADMIN_USER);
browser('find','label','Password','fill',env.WEBFACTORY_ADMIN_PASSWORD);
browser('eval',`document.querySelector('form.wf-form').requestSubmit()`);
console.log('PASS: public routes, protected admin routes, private/no-store public DTO, registry/pending links, search/filter/empty state, 320/768/1440 overflow. Admin login submitted securely.');
const loginDeadline=Date.now()+20000;
while(!browser('get','url').trim().endsWith('/admin')){
  if(Date.now()>loginDeadline)throw Error('Admin login did not complete; credentials suppressed.');
}
browser('open',base+'/designs');
assert.ok(JSON.parse(browser('eval',`!!document.querySelector('[data-preview-slug="nasirtesting"] .wf-preview-admin a[href="/admin/requests/c22f0dc2-5b94-4998-a8fb-f873790802ad"]')`)));
for(const width of [320,768,1440]){
  browser('set','viewport',String(width),'1000');
  assert.equal(JSON.parse(browser('eval','document.documentElement.scrollWidth>innerWidth')),false);
}
console.log('PASS: authenticated admin-only request metadata and mobile overflow.');
browser('close');
