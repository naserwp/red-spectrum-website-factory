import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const load=(file,deps)=>{const m={exports:{}};new Function('require','module','exports',ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(name=>{if(name==='server-only')return {};if(name in deps)return deps[name];throw Error(name);},m,m.exports);return m.exports;};
const rules=load('lib/webfactory/slug-rules.ts',{});
const sites=JSON.parse(readFileSync('customers/manifest.json','utf8')).customers;
const catalog=load('lib/webfactory/preview-catalog.ts',{'next/headers':{},'@/lib/customers/registry':{getCustomerSites:()=>sites},'@/lib/customers/domains':{canonicalCustomerUrl:()=>null},'./build-receipts':{getLocalBuildReceipt:()=>null},'./server':{},'./slug-rules':rules,'./route-readiness':{verifyCustomerRoute:async()=>false,localCustomerUrl:(slug,host)=>host.startsWith('localhost:')?'http://'+host+'/'+slug:null}});
const row={id:'private-request-id',business:'Synthetic Studio',industry:'Design',status:'reviewing',customer_slug:'synthetic-studio',stage:'build_approved',preview_url:'https://preview.redspectrum.ai/synthetic-studio',review_status:null,review_url:null,updated_at:new Date(),action_count:'3',email:'private@example.invalid',phone:'5551234567',notes:'PRIVATE_CANARY',brief:{secret:'PRIVATE_CANARY'}};
const publicCards=catalog.assemblePreviewCards([row],false),pending=publicCards.find(c=>c.slug===row.customer_slug);
assert.equal(pending.href,null);assert.equal(pending.status,'build approved');
for(const secret of ['private-request-id','private@example.invalid','5551234567','PRIVATE_CANARY','requestHref','actionCount'])assert.ok(!JSON.stringify(publicCards).includes(secret));
assert.equal(catalog.assemblePreviewCards([row],true).find(c=>c.slug===row.customer_slug).admin.actionCount,3);
assert.equal(catalog.assemblePreviewCards([{...row,customer_slug:sites[0].slug}],false).filter(c=>c.slug===sites[0].slug).length,1);
for(const status of ['changes_requested','rebuilding'])assert.equal(catalog.publicRequestStatus({...row,review_status:status}),'changes requested');
assert.equal(catalog.publicRequestStatus({...row,review_status:'approved'}),'approved');
assert.equal(catalog.publicRequestStatus({...row,review_status:'preview_ready'}),'preview ready');
assert.equal(publicCards.length,sites.length+1);
console.log('PASS: registry/request merge, pending link gate, status mapping, public DTO privacy, admin-only metadata.');
const slug='swenzy-logistics',urls=rules.previewUrls(slug);
assert.equal(await catalog.resolvePreviewLink(slug,null,'webfactory.redspectrum.ai',async url=>url===urls.fallback),urls.fallback);
assert.equal(await catalog.resolvePreviewLink(slug,urls.primary,'webfactory.redspectrum.ai',async url=>url===urls.fallback),urls.fallback);
assert.equal(await catalog.resolvePreviewLink(slug,urls.fallback,'webfactory.redspectrum.ai',async()=>true),urls.fallback);
assert.equal(await catalog.resolvePreviewLink(slug,null,'webfactory.redspectrum.ai',async()=>true),urls.primary);
assert.equal(await catalog.resolvePreviewLink(slug,null,'preview.redspectrum.ai',async()=>false),null);
assert.equal(await catalog.resolvePreviewLink(slug,null,'localhost:3012',async()=>false),null);
const checked=[];
await catalog.resolvePreviewLink(slug,'https://evil.invalid/private','webfactory.redspectrum.ai',async url=>{checked.push(url);return false;});
assert.deepEqual(checked,[urls.primary,urls.fallback]);
console.log('PASS: exact URLs, DNS/route failure fallback, verified saved URL precedence, unavailable previews disabled, local-only preview fallback and URL allowlist.');

for (const reachable of [true,false]) {
 const deps={'next/headers':{headers:async()=>new Headers({host:'webfactory.redspectrum.ai'})},'@/lib/customers/registry':{getCustomerSites:()=>sites},'@/lib/customers/domains':{canonicalCustomerUrl:()=>null},'./build-receipts':{getLocalBuildReceipt:()=>null},'./server':{isAdmin:async()=>false,database:()=>({query:async()=>({rows:[{...row,customer_slug:sites[0].slug,stage:'draft',review_status:null},{...row,id:'second',customer_slug:sites[1].slug,stage:'customer_approved'}]})})},'./slug-rules':rules,'./route-readiness':{verifyCustomerRoute:async()=>reachable,localCustomerUrl:()=>null}};
 const result=await load('lib/webfactory/preview-catalog.ts',deps).customerPreviewCatalog();
 assert.equal(result.cards.find(c=>c.slug===sites[0].slug).status,'building');
 assert.equal(result.cards.find(c=>c.slug===sites[1].slug).status,'approved');
 assert.equal(Boolean(result.cards.find(c=>c.slug===sites[0].slug).href),reachable);
}
console.log('PASS: reachable draft cannot imply approval; unavailable link cannot erase recorded approval.');
