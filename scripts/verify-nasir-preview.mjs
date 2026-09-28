// Read-only HTTPS/browser verification. Never changes a job or customer state.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {parseEnv} from 'node:util';
import {command} from './build-worker/runtime.mjs';
import {recorder,checkHtml,checkBrowser,safeResults} from './build-worker/qa.mjs';
const base=process.argv[2],url=new URL(base);
assert.equal(url.protocol,'https:');assert.match(url.hostname,/^[a-z0-9-]+\.vercel\.app$/);assert.equal(url.pathname,'/');
const id='be19fdd6-cd63-4313-9c75-c8c187486024',slug='nasirtesting';
const dir='../rs-webfactory-builds/'+id,env=parseEnv(await readFile('.env.worker.local','utf8'));
const manifest=JSON.parse(await readFile(dir+'/customers/manifest.json','utf8')),site=manifest.customers.find(c=>c.slug===slug);
const job={id,customerSlug:slug,requestId:'c22f0dc2-5b94-4998-a8fb-f873790802ad'};
const record=recorder(),browser=(...args)=>command(process.execPath,[env.AGENT_BROWSER_CLI,'--session','nasir-https-review',...args],process.cwd(),{AGENT_BROWSER_EXECUTABLE_PATH:env.AGENT_BROWSER_EXECUTABLE_PATH},45000);
try{
 record.assert('privacy',site.form.mode==='disabled'&&!site.myndy.embed.enabled);
 for(const page of ['','/services','/about','/contact','/privacy']){
  const response=await fetch(base+'/'+slug+page,{redirect:'error',signal:AbortSignal.timeout(15000)}),html=await response.text();
  checkHtml(record,html,response.status,job,site,page);
  record.assert('tenant-isolation',!manifest.customers.filter(c=>c.slug!==slug).some(c=>html.includes(c.business.name)),page);
  await browser('open',base+'/'+slug+page);await browser('snapshot','-i');
  for(const width of [320,768,1440]){
   await browser('set','viewport',String(width),'1000');
   await browser('eval',`Promise.all([...document.images].map(i=>i.complete?Promise.resolve():new Promise(r=>{i.addEventListener('load',r,{once:true});i.addEventListener('error',r,{once:true});setTimeout(r,5000)}))).then(()=>true)`);
   const result=JSON.parse(await browser('eval',`({overflow:document.documentElement.scrollWidth>innerWidth,images:[...document.images].every(i=>i.complete&&i.naturalWidth>0),leak:[...document.querySelectorAll('a[href^="/"]')].some(a=>{const p=a.getAttribute('href').split(/[?#]/)[0];return p!=='/${slug}'&&!p.startsWith('/${slug}/')}),error:!!document.querySelector('[data-nextjs-dialog]')})`));
   checkBrowser(record,result,page,width);
   if(width===320){await browser('eval',`(()=>{const d=document.querySelector('header details');if(d)d.open=true;return true})()`);record.assert('mobile-overflow',!JSON.parse(await browser('eval','document.documentElement.scrollWidth>innerWidth')),page,width);await browser('eval',`(()=>{const d=document.querySelector('header details');if(d)d.open=false;return true})()`);}
  }
 }
 console.log(JSON.stringify({verified:true,checks:record.results.length,pages:5,widths:[320,768,1440]}));
}catch{console.error('HTTPS preview verification did not pass.');process.exitCode=1;}finally{
 await mkdir('outputs',{recursive:true});await writeFile('outputs/nasir-recovered-preview-qa.json',JSON.stringify({url:base+'/'+slug,results:safeResults(record.results)},null,2));
 try{await browser('close');}catch{}
}
