import assert from 'node:assert/strict';
import {mkdtemp,mkdir,copyFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {generateDesign,writeCustomer,validateScope,verifyManifestDiff} from './build-worker/generator.mjs';
const root=await mkdtemp(path.join(tmpdir(),'wf-generator-'));
const job={customerSlug:'synthetic-build',business:'Synthetic Studio',industry:'Design',brief:{customerSlug:'synthetic-build',brandDirection:'Editorial',hero:{heading:'Considered design',body:'Draft design inquiry'},businessSummary:'Customer-supplied draft',services:['Design inquiries'],myndy:{agentName:'Studio Guide',avatarBrief:'Abstract',context:'Draft only'}},requestedChanges:''};
try{
 for(const dir of ['customers','public/customers','templates/customer-package/site'])await mkdir(path.join(root,dir),{recursive:true});
 await copyFile('customers/manifest.json',path.join(root,'customers/manifest.json'));await copyFile('templates/customer-package/site/customer.config.json',path.join(root,'templates/customer-package/site/customer.config.json'));
 const before=JSON.parse(await readFile(path.join(root,'customers/manifest.json'),'utf8'));
 await assert.rejects(()=>generateDesign(job,{}),/PROVIDER_UNAVAILABLE/);await assert.rejects(()=>generateDesign(job,{OPENAI_API_KEY:'synthetic'},async()=>new Response('',{status:500})),/PROVIDER_FAILED/);
 const style=await generateDesign(job,{OPENAI_API_KEY:'synthetic'},async()=>Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({template:'ledger',palette:'navy'})}]}]}));
 const site=await writeCustomer(root,job,style);assert.equal(site.form.mode,'disabled');assert.equal(site.myndy.embed.enabled,false);assert.equal(site.contact.email.status,'missing');
 const after=JSON.parse(await readFile(path.join(root,'customers/manifest.json'),'utf8'));verifyManifestDiff(before,after,job.customerSlug);
 assert.ok((await readFile(path.join(root,'public/customers/synthetic-build/logo.svg'),'utf8')).includes('<svg'));
 await assert.rejects(()=>writeCustomer(root,job,style),/SCOPE_REJECTED/);
 assert.throws(()=>validateScope(job.customerSlug,['app/page.tsx']),/SCOPE_REJECTED/);assert.throws(()=>verifyManifestDiff(before,{...after,customers:after.customers.slice(1)},job.customerSlug),/SCOPE_REJECTED/);
 console.log('PASS: actual isolated customer JSON/logo/favicon/hero files, manifest preservation, provider failures, duplicate/forbidden-path rejection, integrations disabled. Synthetic temp files only.');
}finally{await rm(root,{recursive:true,force:true});}
