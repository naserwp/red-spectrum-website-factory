import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const load=(file,deps)=>{const m={exports:{}};new Function('require','module','exports',ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(n=>{assert(n in deps,n);return deps[n];},m,m.exports);return m.exports;};
const manifest=JSON.parse(readFileSync('customers/manifest.json','utf8'));
const {proxy}=load('proxy.ts',{'next/server':{NextResponse:{next:()=>({next:true}),rewrite:url=>({rewrite:url.pathname})}},'@/lib/customers/domains':{customerDomainForHost:()=>null},'@/lib/customers/umg-services':{validUmgRoute:()=>false},'@/customers/manifest.json':{default:manifest}});
const request=path=>{const url=new URL('https://preview.redspectrum.ai'+path);url.clone=()=>new URL(url);return {headers:new Headers(),nextUrl:url};};
for(const site of manifest.customers.filter(s=>s.slug!=='broom-home-enterprises-llc'))assert.deepEqual(proxy(request('/'+site.slug)),{next:true});
assert.deepEqual(proxy(request('/rus-transportation/faq')),{rewrite:'/api/branded-preview/rus-transportation/faq'});
assert.deepEqual(proxy(request('/broom-home-enterprises-llc')),{rewrite:'/api/branded-preview/broom-home-enterprises-llc'});
let available=true;
const {GET}=load('app/api/branded-preview/[slug]/[[...path]]/route.ts',{'@/lib/webfactory/server':{database:()=>({query:async()=>({rows:[{id:'request',active_brief_id:'brief'}]})})},'@/lib/webfactory/build-worker':{getVerifiedWorkerBuild:async()=>available?{previewUrl:'https://verified.vercel.app/rus-transportation',protection:'public'}:null},'@/lib/webfactory/preview-verification':{},'@/lib/customers/broom-content':{broomSlug:'broom-home-enterprises-llc',validBroomRoute:()=>false}});
const original=fetch,token=process.env.VERCEL_TOKEN;process.env.VERCEL_TOKEN='test';
try{
 globalThis.fetch=async url=>{assert.equal(String(url),'https://verified.vercel.app/rus-transportation/faq');return new Response('<title>FAQ</title>');};
 const args={params:Promise.resolve({slug:'rus-transportation',path:['faq']})};
 assert.equal((await GET(new Request('https://preview.redspectrum.ai/rus-transportation/faq'),args)).status,200);
 available=false;assert.equal((await GET(new Request('https://preview.redspectrum.ai/rus-transportation/faq'),args)).status,404);
 console.log('PASS registered tenant routes, preserved Broom override, verified worker FAQ and missing-evidence rejection.');
}finally{globalThis.fetch=original;if(token===undefined)delete process.env.VERCEL_TOKEN;else process.env.VERCEL_TOKEN=token;}
