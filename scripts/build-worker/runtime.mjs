import {spawn} from 'node:child_process';
import path from 'node:path';
import {existsSync,readdirSync} from 'node:fs';
export const windows=process.platform==='win32';
export const cleanEnv=Object.fromEntries(['PATH','PATHEXT','HOME','USERPROFILE','APPDATA','LOCALAPPDATA','SystemRoot','SYSTEMROOT','SystemDrive','ComSpec','TEMP','TMP','PROGRAMFILES','PROGRAMFILES(X86)','PROGRAMDATA','ALLUSERSPROFILE','USERNAME'].filter(k=>process.env[k]).map(k=>[k,process.env[k]]));
Object.assign(cleanEnv,{CI:'1',NEXT_TELEMETRY_DISABLED:'1',WEBFACTORY_CUSTOMER_EMAILS_ENABLED:'false',WEBFACTORY_INTERNAL_NOTIFICATIONS_ENABLED:'false'});
const children=new Set();
export function stop(child){
 if(!child?.pid)return;
 if(windows)spawn('taskkill',['/pid',String(child.pid),'/T','/F'],{windowsHide:true,stdio:'ignore'});
 else try{process.kill(-child.pid,'SIGTERM');}catch{}
}
export function stopAll(){for(const child of children)stop(child);}
export function launch(cmd,args,options={}){
 const child=spawn(cmd,args,{shell:false,windowsHide:true,detached:!windows,...options});
 children.add(child);child.once('close',()=>children.delete(child));return child;
}
export const command=(cmd,args,cwd,extra={},timeout=600000,input)=>new Promise((resolve,reject)=>{
 // Native Windows browser daemon can inherit wrapper pipes; bypass its JS shim.
 const browserBinary=args[0]?.endsWith('agent-browser.js')?path.join(path.dirname(args[0]),`agent-browser-win32-${process.arch}.exe`):null;
 if(windows&&browserBinary&&existsSync(browserBinary)){cmd=browserBinary;args=args.slice(1);}
 if(cmd==='npm'){
  const volta=path.join(process.env.PROGRAMFILES||'','Volta/tools/image/node');
  const candidates=windows&&existsSync(volta)?readdirSync(volta).map(v=>path.join(volta,v,'node_modules/npm/bin/npm-cli.js')):[];
  const npm=[process.env.npm_execpath,path.join(path.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js'),path.join(path.dirname(process.execPath),'../node_modules/npm/bin/npm-cli.js'),...candidates].find(p=>p&&existsSync(p));
  if(!npm){reject(Error('CONFIGURATION_MISSING'));return;}
  args=[npm,...args];cmd=process.execPath;
 }
 const child=launch(cmd,args,{cwd,env:{...cleanEnv,...extra},stdio:[input===undefined?'ignore':'pipe','pipe','pipe']});let out='';
 if(input!==undefined){child.stdin.on('error',()=>{});child.stdin.end(input);}
 const timer=setTimeout(()=>{stop(child);reject(Error('WORKER_INTERRUPTED'));},timeout);
 child.stdout.on('data',x=>{out+=x;if(out.length>4000000)stop(child);});child.stderr.on('data',()=>{});
 child.on('error',()=>{clearTimeout(timer);reject(Error('WORKER_INTERRUPTED'));});
 child.on('close',code=>{clearTimeout(timer);if(code===0)resolve(out.trim());else reject(Error('WORKER_INTERRUPTED'));});
 if(windows&&browserBinary)child.on('exit',code=>{clearTimeout(timer);setTimeout(()=>{child.stdout.destroy();child.stderr.destroy();if(code===0)resolve(out.trim());else reject(Error('WORKER_INTERRUPTED'));},50);});
});
export function assertRoot(root,checkout){
 const contains=(a,b)=>{const r=path.relative(a,b);return !r || (!r.startsWith('..'+path.sep)&&r!=='..'&&!path.isAbsolute(r));};
 if(!path.isAbsolute(root)||root===path.parse(root).root||contains(checkout,root)||contains(root,checkout))throw Error('Dedicated worker storage outside checkout required');
}
