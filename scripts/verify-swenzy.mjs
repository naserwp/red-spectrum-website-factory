import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
const cli = process.env.AGENT_BROWSER_CLI || "C:/Users/USER/AppData/Local/npm-cache/_npx/6de2aa2fded2970c/node_modules/agent-browser/bin/agent-browser.js";
const base = process.env.PREVIEW_BASE || "http://localhost:3006";
const out = "customers/swenzy-logistics/qa";
await mkdir(out,{recursive:true});
function browser(...args) { return execFileSync(process.execPath,[cli,"--session","swenzy-qa",...args],{encoding:"utf8",timeout:25000}); }
const inspection = `(async()=>{
 for(const img of document.images) img.loading="eager";
 await Promise.all(Array.from(document.images).map(img=>img.decode().catch(()=>{})));
 document.getAnimations().forEach(a=>{if(a.effect?.getComputedTiming().iterations!==Infinity)a.finish()});
 const widget=document.querySelector("myndy-convai");
 return {url:location.href,width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,
 title:document.title,h1:document.querySelector("h1")?.textContent,
 images:Array.from(document.images).map(i=>({alt:i.alt,loaded:i.complete&&i.naturalWidth>0})),
 widgets:document.querySelectorAll("myndy-convai").length,agent:widget?.getAttribute("agent_id"),
 widgetControls:Array.from(widget?.shadowRoot?.querySelectorAll("button")||[]).map(b=>b.getAttribute("aria-label")||b.textContent),
 favicon:document.querySelector("link[rel=icon]")?.getAttribute("href"),
 canonical:document.querySelector("link[rel=canonical]")?.getAttribute("href"),
 hasSchema:!!document.querySelector('script[type="application/ld+json"]'),
 formDisabled:document.querySelector('.sw-form button[type=submit]')?.disabled,
 links:Array.from(document.querySelectorAll("a")).map(a=>a.getAttribute("href")),
 overlay:!!document.querySelector("[data-nextjs-dialog]")};
})()`;
function evaluate(s) { return JSON.parse(execFileSync(process.execPath,[cli,"--session","swenzy-qa","eval","--stdin"],{encoding:"utf8",input:s,timeout:25000})); }
const results=[];
for(const [device,w,h] of [["desktop",1440,1000],["mobile",390,844]]){
 browser("set","viewport",String(w),String(h));
 for(const page of ["home","services","about","contact","privacy"]){
  browser("open",base+"/swenzy-logistics"+(page==="home"?"":"/"+page));
  const result=evaluate(inspection);
  browser("screenshot",out+"/"+page+"-"+device+".png","--full");
  results.push({device,page,...result});
  console.log(device,page,JSON.stringify({overflow:result.overflow,images:result.images.every(i=>i.loaded),widgets:result.widgets,heading:result.h1}));
 }
}
const api=[];
for(const [name,slug,extra] of [["disabled","swenzy-logistics",{}],["spam","swenzy-logistics",{botcheck:"bot"}],["invalid","swenzy-logistics",{email:"bad"}],["unknown","not-a-customer",{}]]){
 const data=new FormData();
 Object.entries({name:"Synthetic QA",email:"qa@example.com",phone:"2255550100",service:"Transportation inquiry",message:"TEST - local validation only; no delivery authorized.",consent:"on",botcheck:"",...extra}).forEach(([k,v])=>data.set(k,v));
 const r=await fetch(base+"/api/leads/"+slug,{method:"POST",body:data}); api.push({name,status:r.status,body:await r.json()});
}
const privateRoutes=[];
for(const route of ["/swenzy-logistics/not-a-page","/swenzy-logistics/about/extra","/customers/swenzy-logistics/brief/customer-brief.json","/customers/swenzy-logistics/myndy/agent-context.md","/customers/manifest.json"]){
 const r=await fetch(base+route);privateRoutes.push({route,status:r.status});
}
const errors=browser("errors");
await writeFile(out+"/verification.json",JSON.stringify({checkedAt:new Date().toISOString(),base,results,api,privateRoutes,browserErrors:errors},null,2));
if(results.some(r=>r.overflow||!r.images.every(i=>i.loaded)||r.widgets!==1||r.overlay)||api.map(r=>r.status).join(",")!=="503,400,400,404"||privateRoutes.some(r=>r.status!==404))process.exitCode=1;
console.log(JSON.stringify({api,privateRoutes,errors},null,2));
