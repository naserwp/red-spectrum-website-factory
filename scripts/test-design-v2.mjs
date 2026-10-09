import assert from 'node:assert/strict';
import {readFile,mkdtemp,mkdir,writeFile,symlink,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {customerBuildPath} from '../lib/webfactory/build-paths.ts';
import {designSchema} from '../lib/customers/design-contract.ts';
import {customerManifestSchema} from '../lib/customers/schema.ts';
import {generateV2,logoSvg,approvedLocalImages,parseGeneratedDesign} from './build-worker/generator-v2.mjs';
const s={kind:'split',eyebrow:'Introduction',heading:'A considered beginning',body:'Contact the company to discuss your needs.',image:0,reverse:false};
const d={version:'2.0',hero:'editorial',navigation:'balanced',typography:'editorial',spacing:'generous',palette:'forest',logo:'open-frame',pages:{home:Array(6).fill(s),services:[s,s],about:[s,s],contact:[s],privacy:[s]},imageDirection:'Illustrative spaces',brandNotes:'Three geometric concepts reviewed.'};
assert(designSchema.safeParse(d).success);
for(const value of ['<script>alert(1)</script>','https://tracker.example/a','javascript:alert(1)','OPENAI_API_KEY'])assert(!designSchema.safeParse({...d,brandNotes:value}).success);
for(const file of ['../x','app/page.tsx','.env','lib/a.ts','customers/other/site/customer.config.json','public/customers/demo/images/../../secret','public/customers/demo/secrets.json','public/customers/demo/a.js','public/customers/demo/images/tracker.svg'])assert(!customerBuildPath('demo',file),file);
for(const file of ['customers/demo/site/customer.config.json','customers/demo/delivery/image-inventory.json','public/customers/demo/images/image-7.webp','public/customers/demo/logo-dark.svg'])assert(customerBuildPath('demo',file),file);
const manifest=customerManifestSchema.parse(JSON.parse(await readFile('customers/manifest.json','utf8')));assert(manifest.customers.length>=5);for(const customer of manifest.customers)if(customer.design)assert(designSchema.safeParse(customer.design).success);
for(const src of ['/customers/other/image.webp','https://tracker.example/a','/customers/'+manifest.customers[0].slug+'/../secret']){const m=structuredClone(manifest);m.customers[0].images.hero.src=src;assert(!customerManifestSchema.safeParse(m).success);}
assert(logoSvg('Example Studio LLC','interlock','#123456','#ffffff').includes('<svg'));assert(!logoSvg('<script>','ligature','#123456','#fff').includes('<script>'));
const output=await generateV2({business:'Synthetic',industry:'Design',brief:{brandDirection:'Editorial'},requestedChanges:'Untrusted data'}, {OPENAI_API_KEY:'test'},async()=>Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(d)}]}]}));assert.equal(output.contract,'2.0');
assert.throws(()=>parseGeneratedDesign({output:[]}),e=>e.validationCodes[0]==='invalid_json');
assert.throws(()=>parseGeneratedDesign({output:[{content:[{type:'output_text',text:JSON.stringify({...d,brandNotes:''})}]}]}),e=>e.validationCodes.includes('too_small')&&!JSON.stringify(e).includes('brandNotes'));
await generateV2({business:'Synthetic',industry:'Design',brief:{},requestedChanges:''},{OPENAI_API_KEY:'test'},async(_url,init)=>{const schema=JSON.parse(init.body).text.format.schema;assert.equal(schema.properties.brandNotes.minLength,1);assert.equal(schema.properties.pages.properties.home.minItems,5);assert.equal(schema.properties.pages.properties.home.items.properties.image.maximum,11);return Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(d)}]}]});});
const qa=await readFile('scripts/build-worker/qa.mjs','utf8');assert(qa.includes('320,375,768,1024,1440,1920'));
const tmp=await mkdtemp(path.join(os.tmpdir(),'wf-assets-'));
try{
 const dir=path.join(tmp,'demo');await mkdir(dir);await writeFile(path.join(dir,'image-0.webp'),'synthetic');
 const manifest={customerSlug:'demo',approved:true,images:[{file:'image-0.webp',provenance:'customer-provided',source:'Approved customer upload'}]};
 const save=()=>writeFile(path.join(dir,'inventory.json'),JSON.stringify(manifest));await save();
 assert.equal((await approvedLocalImages('demo',tmp)).length,1);
 manifest.customerSlug='other';await save();await assert.rejects(()=>approvedLocalImages('demo',tmp));manifest.customerSlug='demo';
 manifest.images[0].file='../secret';await save();await assert.rejects(()=>approvedLocalImages('demo',tmp));
 manifest.images[0].file='https://tracker.example/a';await save();await assert.rejects(()=>approvedLocalImages('demo',tmp));
 await symlink(dir,path.join(tmp,'linked'),process.platform==='win32'?'junction':'dir');await assert.rejects(()=>approvedLocalImages('linked',tmp));
}finally{await rm(tmp,{recursive:true,force:true});}
console.log('PASS: v2 data contract, original logo escaping, provider parsing, cross-tenant/root/secret/traversal/executable paths, unsafe content, external assets, legacy manifests and six-width configuration. No external calls.');
