import { execFileSync } from "node:child_process";
const cli=process.env.AGENT_BROWSER_CLI||"C:/Users/USER/AppData/Local/npm-cache/_npx/6de2aa2fded2970c/node_modules/agent-browser/bin/agent-browser.js";
const browser=(...args)=>execFileSync(process.execPath,[cli,"--session","swenzy-qa",...args],{encoding:"utf8",timeout:25000});
const base=process.env.PREVIEW_BASE||"http://localhost:3006";
browser("set","viewport","1440","1000");
for(const page of ["home","services","about","contact","privacy"]){
 browser("open",base+"/swenzy-logistics"+(page==="home"?"":"/"+page));
 const input=`(async()=>{document.querySelectorAll("details").forEach(d=>d.open=true); for(const img of document.images)img.loading="eager";await Promise.all(Array.from(document.images).map(i=>i.decode().catch(()=>{}))); const style=document.createElement("style");style.textContent="myndy-convai{display:none!important}";document.head.appendChild(style);return {images:Array.from(document.images).every(i=>i.complete&&i.naturalWidth),height:document.documentElement.scrollHeight};})()`;
 console.log(page,execFileSync(process.execPath,[cli,"--session","swenzy-qa","eval","--stdin"],{encoding:"utf8",input,timeout:25000}).trim());
 browser("screenshot","customers/swenzy-logistics/qa/pdf-"+page+".png","--full");
}
