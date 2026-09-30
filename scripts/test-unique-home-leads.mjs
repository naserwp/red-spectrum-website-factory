// Real PostgreSQL, isolated disposable tables, real application code, blocked mail transport.
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
process.env.WEBFACTORY_CUSTOMER_EMAILS_ENABLED='false';
process.env.WEBFACTORY_INTERNAL_NOTIFICATIONS_ENABLED='false';
process.env.WEBFACTORY_LEAD_LIVE_ACTIVE_SLUGS='unique-home-enterprise';
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
const site=registry.getCustomerSite('unique-home-enterprise');
assert.equal(site.form.mode,'live');assert.equal(site.form.recipientConfirmed,true);
const other=registry.getCustomerSite('lc-real-estate');
const config=load('lib/leads/config.ts'),validation=load('lib/leads/validation.ts'),email=load('lib/leads/email.ts');
assert.equal(config.getCustomerDelivery(site,'live').recipient,'contact@uniquehomeenterprise.com');
assert.equal(config.getCustomerDelivery(other,'live').recipient,'accountexec@theredspectrum.com');
assert.notEqual(config.getCustomerDelivery(other,'live').recipient,config.getCustomerDelivery(site,'live').recipient);
assert.ok(config.getSendGridConfig(),'Required config missing or invalid');
const schema='uh_lead_qa_'+randomUUID().replaceAll('-','');
assert.match(schema,/^uh_lead_qa_[a-f0-9]{32}$/);
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
  await pool.query(readFileSync('db/migrations/0010_lead_myndy_sync.sql','utf8'));
  class ScopedPool{query(...args){return pool.query(...args);}}
  const storeModule=load('lib/leads/store.ts',{pg:{Pool:ScopedPool}});
  const myndy=load('lib/leads/myndy-contacts.ts');
  process.env.MYNDY_API_KEY_UNIQUE_HOME='synthetic-test-key';
  const service=load('lib/leads/service.ts',{'./myndy-contacts':myndy,'./config':config,'./email':email,'./store':storeModule,'./validation':validation,'@/lib/customers/registry':registry});
  const route=load('app/api/leads/[customerSlug]/route.ts',{'@/lib/customers/registry':registry,'@/lib/leads/service':service,'@/lib/leads/validation':validation,'@/lib/customers/domains':load('lib/customers/domains.ts')});
  const base={name:'Synthetic Unique Home QA',email:'synthetic@example.invalid',service:'Consulting',message:'Synthetic <script>safe</script> inquiry. Do not deliver.',consent:'on',botcheck:''};
  async function submit(extra={},slug='unique-home-enterprise',ip=randomUUID(),origin='https://uniquehomeenterprise.com'){
    const data=new FormData();for(const [k,v] of Object.entries({...base,...extra}))if(v!==undefined)data.set(k,v);
    const response=await route.POST(new Request('https://uniquehomeenterprise.com/api/leads/'+slug,{method:'POST',headers:{origin, 'x-forwarded-for':ip},body:data}),{params:Promise.resolve({customerSlug:slug})});
    return {status:response.status,body:await response.json()};
  }
  assert.equal((await submit()).status,503);
  assert.equal((await pool.query('SELECT count(*) FROM website_leads')).rows[0].count,'0');
  for(const bad of [{email:'invalid'},{consent:undefined},{name:''},{message:''},{service:''},{service:'Brokerage'},{recipient:'bad@example.invalid'},{mode:'live'},{botcheck:'bot'}])assert.equal((await submit(bad)).status,400);
  assert.equal((await submit({},'not-a-customer')).status,404);
  assert.equal((await submit({},'unique-home-enterprise',randomUUID(),'https://attacker.example')).status,403);
  process.env.WEBFACTORY_CUSTOMER_EMAILS_ENABLED='true';
  let providerStatus=202;
  let myndyStatus=200,myndyCount=0;
  globalThis.fetch=async(url,options)=>{
    if(url==='https://hello.myndy.ai/api/webhooks/contacts'){
      myndyCount++;
      assert.equal(options.headers['X-API-Key'],'synthetic-test-key');
      const payload=JSON.parse(options.body);
      assert.deepEqual(payload.tags,['website','unique-home-enterprise']);
      assert.equal(payload.email,base.email);
      assert.equal(payload.agent_id,undefined);
      return new Response(null,{status:myndyStatus});
    }
    assert.equal(url,'https://api.sendgrid.com/v3/mail/send');
    lastPayload=JSON.parse(options.body);sendCount++;
    assert.equal(lastPayload.personalizations.length,1);
    assert.equal(lastPayload.personalizations[0].to[0].email,'contact@uniquehomeenterprise.com');
    assert.equal(lastPayload.personalizations[0].cc,undefined);assert.equal(lastPayload.personalizations[0].bcc,undefined);
    assert.equal(lastPayload.reply_to.email,base.email);
    assert.ok(lastPayload.content[0].value.includes('UNIQUE HOME ENTERPRISE LLC'));
    assert.ok(lastPayload.content[0].value.includes('uniquehomeenterprise.com'));
    return new Response(null,{status:providerStatus,headers:{'x-message-id':'synthetic-not-delivered'}});
  };
  const good=await submit();assert.equal(good.status,200);assert.equal(good.body.ok,true);
  assert.equal(good.body.message,'Thank you. Your inquiry has been received.');
  const persisted=(await admin.query('SELECT * FROM '+schema+'.website_leads WHERE lead_id=$1',[good.body.leadId])).rows[0];
  assert.equal(persisted.customer_slug,'unique-home-enterprise');assert.equal(persisted.notification_status,'accepted');
  assert.equal(persisted.recipient_email,'contact@uniquehomeenterprise.com');
  assert.equal(persisted.requested_service,'Consulting');
  assert.ok(lastPayload.content[1].value.includes('&lt;script&gt;'));
  assert.equal((await submit()).body.duplicate,true);assert.equal(sendCount,1);
  assert.equal(myndyCount,1);assert.equal(persisted.myndy_sync_status,'accepted');
  myndyStatus=500;
  const syncFailure=await submit({message:'Synthetic Myndy failure preserves email and lead.'});
  assert.equal(syncFailure.status,200);
  const syncRow=(await pool.query('SELECT * FROM website_leads WHERE lead_id=$1',[syncFailure.body.leadId])).rows[0];
  assert.equal(syncRow.notification_status,'accepted');assert.equal(syncRow.myndy_sync_status,'failed');
  assert.equal(syncRow.myndy_last_error,'myndy_500');
  const countBefore=myndyCount;
  await submit({message:'Synthetic Myndy failure preserves email and lead.'});
  assert.equal(myndyCount,countBefore);
  delete process.env.MYNDY_API_KEY_UNIQUE_HOME;
  assert.equal((await submit({message:'Synthetic missing key preserves email.'})).status,200);
  assert.equal(myndyCount,countBefore);
  process.env.MYNDY_API_KEY_UNIQUE_HOME='synthetic-test-key';myndyStatus=200;
  providerStatus=500;
  const failed=await submit({message:'Synthetic retry test, no email will be sent.'});
  assert.equal(failed.status,503);assert.equal(failed.body.ok,false);assert.equal(failed.body.saved,true);
  const before=sendCount;
  assert.equal((await submit({message:'Synthetic retry test, no email will be sent.'})).status,503);assert.equal(sendCount,before);
  process.env.WEBFACTORY_LEAD_LIVE_ACTIVE_SLUGS='lc-real-estate';
  const isolated=await submit({message:'Allowlist isolation test.'});
  assert.equal(isolated.status,503);
  process.env.WEBFACTORY_LEAD_LIVE_ACTIVE_SLUGS='unique-home-enterprise';
  providerStatus=202;
  const ip=randomUUID();for(let i=0;i<8;i++)assert.notEqual((await submit({message:'Synthetic rate test '+i},site.slug,ip)).status,429);
  assert.equal((await submit({},site.slug,ip)).status,429);
  const tenants=await pool.query('SELECT DISTINCT customer_slug FROM website_leads');assert.deepEqual(tenants.rows,[{customer_slug:site.slug}]);
  console.log('PASS: UNIQUE HOME isolated lead persistence, recipient isolation, Reply-To, escaped content, duplicate suppression, rate limit, allowlist, safe errors. SendGrid mocked; ZERO real emails.');
}catch(error){
  console.error(String(error.stack || '').split('\n').filter(line=>line.includes('scripts/test-unique-home-leads.mjs:')).join('\n'));
  console.error('FAIL: UNIQUE HOME isolated integration test. No secrets or raw errors logged.');process.exitCode=1;
}finally{
  globalThis.fetch=realFetch;
  await pool.end();
  if(created){
    await admin.query('DROP TABLE IF EXISTS '+schema+'.website_leads');
    await admin.query('DROP TABLE IF EXISTS '+schema+'.website_lead_rate_limits');
    await admin.query('DROP SCHEMA '+schema);
  }
  await admin.end();
  console.log('Isolated synthetic test tables removed; no live leads or customer records changed.');
}
