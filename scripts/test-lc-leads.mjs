// Real PostgreSQL, isolated disposable tables, real application code, blocked mail transport.
// No send to SendGrid is possible from this process.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import ts from 'typescript';
import pg from 'pg';
import nextEnv from '@next/env';
const require=createRequire(import.meta.url);
nextEnv.loadEnvConfig(process.cwd(),false,{info(){},error(){}});
const realFetch=globalThis.fetch;
globalThis.fetch=async()=>{throw Error('External network blocked by test');};
// Process-only fixtures: never alter the local server's activation or environment files.
process.env.WEBFACTORY_CUSTOMER_EMAILS_ENABLED='false';
process.env.WEBFACTORY_INTERNAL_NOTIFICATIONS_ENABLED='false';
const load=(file,deps={})=>{
  const testModule={exports:{}};
  const code=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  new Function('require','module','exports',code)(name=>{
    if(name==='server-only')return {};
    if(name in deps)return deps[name];
    if(['zod','node:crypto'].includes(name))return require(name);
    throw Error('Unexpected dependency');
  },testModule,testModule.exports);return testModule.exports;
};
const manifest=JSON.parse(readFileSync('customers/manifest.json','utf8'));
const registry={getCustomerSite:slug=>manifest.customers.find(site=>site.slug===slug)};
const site=registry.getCustomerSite('lc-real-estate');
assert.equal(site.form.mode,'test');assert.equal(site.form.testPassed,false);
const config=load('lib/leads/config.ts'),validation=load('lib/leads/validation.ts'),email=load('lib/leads/email.ts');
assert.equal(config.getCustomerDelivery(site,'live').recipient,'accountexec@theredspectrum.com');
const testRecipient='nasir@factiiv.io';
assert.equal(config.getCustomerDelivery(site,'test').recipient,testRecipient);
assert.ok(config.getSendGridConfig(),'Required config missing or invalid');
assert.equal(process.env.WEBFACTORY_CUSTOMER_EMAILS_ENABLED,'false');
assert.equal(process.env.WEBFACTORY_INTERNAL_NOTIFICATIONS_ENABLED,'false');
const schema='lc_lead_qa_'+randomUUID().replaceAll('-','');
assert.match(schema,/^lc_lead_qa_[a-f0-9]{32}$/);
const admin=new pg.Pool({connectionString:process.env.LEADS_DATABASE_URL,connectionTimeoutMillis:5000});
const dbPool=new pg.Pool({connectionString:process.env.LEADS_DATABASE_URL,connectionTimeoutMillis:5000});
const pool={
  query:(sql,values)=>dbPool.query(sql.replace(/\bwebsite_lead_rate_limits\b/g,schema+'.website_lead_rate_limits').replace(/\bwebsite_leads\b/g,schema+'.website_leads'),values),
  end:()=>dbPool.end(),
};
let created=false,sendCount=0,lastPayload;
try{
  await admin.query('CREATE SCHEMA '+schema);created=true;
  await admin.query('CREATE TABLE '+schema+'.website_leads (LIKE public.website_leads INCLUDING ALL)');
  await admin.query('CREATE TABLE '+schema+'.website_lead_rate_limits (LIKE public.website_lead_rate_limits INCLUDING ALL)');
  class ScopedPool{query(...args){return pool.query(...args);}}
  const storeModule=load('lib/leads/store.ts',{pg:{Pool:ScopedPool}});
  const service=load('lib/leads/service.ts',{'./config':config,'./email':email,'./store':storeModule,'./validation':validation,'@/lib/customers/registry':registry,'./myndy-contacts':{myndyContactSyncConfigured:()=>false}});
  const route=load('app/api/leads/[customerSlug]/route.ts',{'@/lib/customers/domains':{customerDomainForHost:()=>null},'@/lib/customers/registry':registry,'@/lib/leads/service':service,'@/lib/leads/validation':validation});
  const base={name:'Synthetic L&C QA',email:'synthetic@example.invalid',phone:'2025550100',service:'Property opportunities',investmentInterest:'Property opportunities',budgetRange:'Prefer to discuss',propertyType:'Residential',message:'Synthetic <script>safe</script> inquiry. Do not deliver.',consent:'on',botcheck:''};
  async function submit(extra={},slug='lc-real-estate',ip=randomUUID()){
    const data=new FormData();for(const [k,v] of Object.entries({...base,...extra}))if(v!==undefined)data.set(k,v);
    const response=await route.POST(new Request('http://localhost:3012/api/leads/'+slug,{method:'POST',headers:{origin:'http://localhost:3012','x-forwarded-for':ip},body:data}),{params:Promise.resolve({customerSlug:slug})});
    return {status:response.status,body:await response.json()};
  }
  assert.equal((await submit()).status,503);
  assert.equal((await pool.query('SELECT count(*) FROM website_leads')).rows[0].count,'0');
  for(const bad of [{email:'invalid'},{consent:undefined},{name:''},{phone:''},{message:''},{investmentInterest:''},{recipient:'bad@example.invalid'},{mode:'live'},{botcheck:'bot'}])assert.equal((await submit(bad)).status,400);
  assert.equal((await submit({},'not-a-customer')).status,404);
  // Enable only inside this process after replacing fetch. Never writes an env file.
  process.env.WEBFACTORY_INTERNAL_NOTIFICATIONS_ENABLED='true';
  let providerStatus=202;
  globalThis.fetch=async(url,options)=>{
    assert.equal(url,'https://api.sendgrid.com/v3/mail/send');
    lastPayload=JSON.parse(options.body);sendCount++;
    assert.equal(lastPayload.personalizations.length,1);
    assert.equal(lastPayload.personalizations[0].to[0].email,testRecipient);
    assert.equal(lastPayload.personalizations[0].cc,undefined);assert.equal(lastPayload.personalizations[0].bcc,undefined);
    assert.equal(lastPayload.reply_to.email,base.email);
    return new Response(null,{status:providerStatus,headers:{'x-message-id':'synthetic-not-delivered'}});
  };
  const good=await submit();assert.equal(good.status,200);assert.equal(good.body.ok,true);
  assert.equal(good.body.message,'Thank you. Your inquiry has been received. A member of the team will follow up with you.');
  assert.deepEqual(Object.keys(good.body).sort(),['leadId','message','ok']);
  const persisted=(await admin.query('SELECT * FROM '+schema+'.website_leads WHERE lead_id=$1',[good.body.leadId])).rows[0];
  assert.equal(persisted.customer_slug,'lc-real-estate');assert.equal(persisted.notification_status,'accepted');
  assert.equal(persisted.investment_interest,base.investmentInterest);assert.equal(persisted.budget_range,base.budgetRange);assert.equal(persisted.property_type,base.propertyType);
  assert.ok(lastPayload.content[1].value.includes('&lt;script&gt;'));
  assert.ok(lastPayload.content[0].value.includes('L&C Real Estate Investment Group'));
  assert.ok(lastPayload.content[0].value.includes('lc-real-estate website'));
  assert.equal((await submit()).body.duplicate,true);assert.equal(sendCount,1);
  providerStatus=500;
  const failed=await submit({message:'Synthetic retry test, no email will be sent.'});
  assert.equal(failed.status,503);assert.equal(failed.body.ok,false);assert.equal(failed.body.saved,true);
  const before=sendCount;
  assert.equal((await submit({message:'Synthetic retry test, no email will be sent.'})).status,503);assert.equal(sendCount,before);
  await pool.query("UPDATE website_leads SET next_retry_at=NOW()-INTERVAL '1 second' WHERE lead_id=$1",[failed.body.leadId]);
  process.env.WEBFACTORY_INTERNAL_NOTIFICATIONS_ENABLED='false';process.env.WEBFACTORY_CUSTOMER_EMAILS_ENABLED='true';
  await service.retryPendingLeadNotifications();assert.equal(sendCount,before,'Test leads must not use the live email gate');
  process.env.WEBFACTORY_CUSTOMER_EMAILS_ENABLED='false';process.env.WEBFACTORY_INTERNAL_NOTIFICATIONS_ENABLED='true';
  providerStatus=202;
  const retries=await service.retryPendingLeadNotifications();assert.equal(retries.accepted,1);
  assert.ok(lastPayload.personalizations[0].subject.includes('L&C Real Estate Investment Group'));
  const bounded=await submit({message:'Synthetic bounded failure test.'});assert.equal(bounded.status,200);
  providerStatus=500;
  const retryFail=await submit({message:'Synthetic retry exhaustion test.'});
  for(let i=0;i<4;i++){await pool.query("UPDATE website_leads SET next_retry_at=NOW()-INTERVAL '1 second' WHERE lead_id=$1",[retryFail.body.leadId]);await service.retryPendingLeadNotifications();}
  assert.equal((await pool.query('SELECT attempt_count FROM website_leads WHERE lead_id=$1',[retryFail.body.leadId])).rows[0].attempt_count,3);
  const store=new storeModule.LeadStore('isolated');
  const claimLead=await store.persist({customerSlug:site.slug,mode:'test',recipient:testRecipient,dedupeKey:randomUUID(),receivedAt:new Date(Date.now()-1000),lead:validation.lcLeadSchema.parse(base)});
  assert.equal((await Promise.all([store.claim(claimLead.lead.leadId),store.claim(claimLead.lead.leadId)])).filter(Boolean).length,1);
  const ip=randomUUID();for(let i=0;i<8;i++)assert.notEqual((await submit({message:'Synthetic rate test '+i},site.slug,ip)).status,429);
  assert.equal((await submit({},site.slug,ip)).status,429);
  const tenants=await pool.query('SELECT DISTINCT customer_slug FROM website_leads');assert.deepEqual(tenants.rows,[{customer_slug:site.slug}]);
  assert.notEqual(validation.leadDedupeKey(site.slug,base,new Date()),validation.leadDedupeKey('swenzy-logistics',base,new Date()));
  console.log('PASS: real PostgreSQL committed persistence read from independent connection; validation, tenant mapping, Reply-To, escaped content, duplicate suppression, lease concurrency, rate limit, retry gating/exhaustion, safe failure and acceptance responses. SendGrid transport mocked; ZERO real emails.');
}catch(error){
  console.error(String(error.stack || '').split('\n').filter(line=>line.includes('scripts/test-lc-leads.mjs:')).join('\n'));
  console.error('FAIL: L&C isolated integration test. No secrets or raw errors logged.');process.exitCode=1;
}finally{
  globalThis.fetch=realFetch;
  await pool.end();
  if(created){
    // Exact fresh test schema only. No CASCADE and no production row cleanup.
    await admin.query('DROP TABLE IF EXISTS '+schema+'.website_leads');
    await admin.query('DROP TABLE IF EXISTS '+schema+'.website_lead_rate_limits');
    await admin.query('DROP SCHEMA '+schema);
  }
  await admin.end();
  console.log('Isolated synthetic test tables removed; no live leads or customer records changed.');
}
