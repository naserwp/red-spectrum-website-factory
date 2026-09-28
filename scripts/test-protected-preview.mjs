import assert from 'node:assert/strict';
import {verifyProtectedPreview,previewProject} from '../lib/webfactory/preview-verification.ts';
const input={previewUrl:'https://test-preview.vercel.app/nasirtesting',deploymentReference:'dpl_test',resultSha:'b'.repeat(40),slug:'nasirtesting',business:'Nasir test'};
const key='synthetic-bypass-not-a-real-secret';
const html='<title>Nasir</title><meta content="noindex"><script type="application/ld+json">'+JSON.stringify({name:input.business,url:'https://preview.redspectrum.ai/nasirtesting'})+'</script>'+['','/services','/about','/contact','/privacy'].map(p=>`<a href="/nasirtesting${p}">Link</a>`).join('');
const original=globalThis.fetch;
let mode='protected',headersSent=0,projectCalls=0;
const apiGet=async endpoint=>endpoint.startsWith('/v13/')?{projectId:previewProject,target:null,readyState:'READY',url:'test-preview.vercel.app',meta:{githubCommitSha:input.resultSha}}:(projectCalls++,{id:previewProject,ssoProtection:{},protectionBypass:{[key]:{scope:'automation-bypass'}}});
try{
 globalThis.fetch=async(url,options)=>{
  assert.equal(new URL(url).hostname,'test-preview.vercel.app');
  assert(!String(url).includes(key));
  if(options.headers){headersSent++;assert.equal(options.headers['x-vercel-protection-bypass'],key);assert.equal(options.redirect,'error');return new Response(mode==='wrong'?'Other customer':html);}
  if(mode==='public')return new Response(html);
  if(mode==='external')return new Response('',{status:302,headers:{location:'https://attacker.example/steal'}});
  if(mode==='error')return new Response('',{status:500});
  return new Response('',{status:302,headers:{location:'https://vercel.com/sso-api'}});
 };
 const result=await verifyProtectedPreview(input,{apiGet});assert.equal(result.preview_public_access,'protected');assert.equal(result.pages.length,5);assert.equal(headersSent,5);assert.equal(projectCalls,1);assert(!JSON.stringify(result).includes(key));
 mode='public';headersSent=0;assert.equal((await verifyProtectedPreview(input,{apiGet})).preview_public_access,'public');assert.equal(headersSent,0);
 for(mode of ['wrong','external','error'])await assert.rejects(()=>verifyProtectedPreview(input,{apiGet}),/^Error: PREVIEW_VERIFICATION_FAILED$/);
 mode='protected';await assert.rejects(()=>verifyProtectedPreview(input,{apiGet:async()=>({projectId:'wrong'})}));
 await assert.rejects(()=>verifyProtectedPreview(input,{apiGet:async e=>e.startsWith('/v13/')?apiGet(e):{id:previewProject,ssoProtection:{}}}));
 await assert.rejects(()=>verifyProtectedPreview(input,{apiGet,otherNames:['Nasir test']}));
 await assert.rejects(()=>verifyProtectedPreview(input,{apiGet,privateValues:['Nasir']}));
 for(const previewUrl of ['https://attacker.example/nasirtesting','https://test-preview.vercel.app/other','https://user:password@test-preview.vercel.app/nasirtesting','https://test-preview.vercel.app/nasirtesting?secret=test'])await assert.rejects(()=>verifyProtectedPreview({...input,previewUrl},{apiGet}));
 console.log('PASS: protected/public semantics, five pages, exact deployment binding, credential header confinement, redirect rejection, wrong tenant/private data, missing credentials, safe error/output.');
}finally{globalThis.fetch=original;}
