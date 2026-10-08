import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const load=(file,deps={})=>{
  const m={exports:{}};
  const code=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  new Function('require','module','exports',code)(name=>{assert(name in deps,name);return deps[name];},m,m.exports);
  return m.exports;
};
const content=load('lib/customers/broom-content.ts');
const slug=content.broomSlug,origin='https://preview.redspectrum.ai';
let verified=null,queries=0,upstream=0;
const route=load('app/api/branded-preview/[slug]/[[...path]]/route.ts',{
  '@/lib/customers/broom-content':content,
  '@/lib/webfactory/server':{database:()=>({query:async(_,args)=>{assert.deepEqual(args,[slug]);queries++;return {rows:[{id:'exact-request',active_brief_id:'exact-brief'}]};}})},
  '@/lib/webfactory/build-worker':{getVerifiedWorkerBuild:async(id,tenant,brief)=>{assert.deepEqual([id,tenant,brief],['exact-request',slug,'exact-brief']);return verified;}},
  '@/lib/webfactory/preview-verification':{previewProject:'test',previewTeam:'test'},
});
const originalFetch=globalThis.fetch,token=process.env.VERCEL_TOKEN;
process.env.VERCEL_TOKEN='synthetic-test-token';
globalThis.fetch=async target=>{upstream++;assert.equal(new URL(target).origin,'https://verified.example.invalid');return new Response('<script>hydration()</script><script type="application/ld+json">{"name":"Broom"}</script><img src="/customers/'+slug+'/images/home.webp"><link href="/_next/static/test.css">',{headers:{'content-type':'text/html'}});};
const request=(tenant,path=[],host=origin)=>route.GET(new Request(`${host}/api/branded-preview/${tenant}/${path.join('/')}`),{params:Promise.resolve({slug:tenant,path})});
try{
  const pages=[[],['services'],['about'],['contact'],['faq'],['privacy'],...content.broomServices.map(s=>['services',s.slug])];
  for(const path of pages){
    const alias=await request('broom-home-enterprises',path);
    assert.equal(alias.status,308);
    assert.equal(alias.headers.get('location'),'/'+slug+(path.length?'/'+path.join('/'):''));
    assert.equal((await request(slug,path)).status,404,'Missing trusted build must block preview');
  }
  assert.equal(upstream,0);
  assert.equal(queries,11);
  verified={previewUrl:'https://verified.example.invalid/'+slug,protection:'public'};
  for(const path of pages){const response=await request(slug,path);assert.equal(response.status,200);const html=await response.text();assert(!html.includes('hydration()'));assert(html.includes('application/ld+json'));assert(html.includes('/api/branded-preview/'+slug+'/customers/'+slug));}
  for(const asset of ['logo.svg','logo-dark.svg','logo-stacked.svg','mark.svg','favicon.svg',...['architecture','building','city','development','hero','home','interior','rental'].map(n=>'images/'+n+'.webp')])assert.equal((await request(slug,['customers',slug,...asset.split('/')])).status,200);
  const before=upstream;
  for(const path of [['services','unknown'],['qa','admin-state.json'],['customers','another-tenant','logo.svg'],['customers',slug,'secret.txt'],['..'],['services','buying','extra']])assert.equal((await request(slug,path)).status,404);
  assert.equal((await request(slug,[],'https://evil.invalid')).status,404);
  assert.equal(upstream,before,'Rejected requests must never reach upstream');
  console.log('PASS: 11 canonical/alias proxy routes, trusted-build gate, 13 assets, tenant isolation, private-path rejection, server-rendered navigation.');
}finally{globalThis.fetch=originalFetch;if(token===undefined)delete process.env.VERCEL_TOKEN;else process.env.VERCEL_TOKEN=token;}
