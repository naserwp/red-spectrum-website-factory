import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {launch,stop} from './runtime.mjs';

// Restart only the poller. Durable leases decide job recovery; never replay a job here.
export async function supervise({start,signal,wait=ms=>new Promise(r=>setTimeout(r,ms)),now=Date.now,log=event=>console.log(JSON.stringify(event)),maxRestarts=3}){
 const crashes=[];
 while(!signal.aborted){
  const started=now();let child;
  const outcome=await new Promise(resolve=>{
   try{child=start();}catch{resolve({code:null});return;}
   const halt=()=>stop(child);
   signal.addEventListener('abort',halt,{once:true});
   const done=(code)=>{signal.removeEventListener('abort',halt);resolve({code});};
   child.once('error',()=>done(null));child.once('close',done);
   log({event:'supervisor_started',pid:child.pid,at:new Date(now()).toISOString()});
   if(signal.aborted)halt();
  });
  if(signal.aborted||outcome.code===0)return 0;
  while(crashes.length&&now()-crashes[0]>600000)crashes.shift();
  crashes.push(now());
  if(crashes.length>maxRestarts){log({event:'supervisor_restart_limit',at:new Date(now()).toISOString()});return 1;}
  const delay=Math.min(60000,1000*2**(crashes.length-1));
  log({event:'supervisor_restarting',exitCode:outcome.code,retryAfterMs:delay,uptimeMs:now()-started});
  await wait(delay);
 }
 return 0;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.argv.length>2)throw Error('Supervisor does not accept job or generation overrides.');
 const controller=new AbortController();
 for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>controller.abort());
 process.exitCode=await supervise({signal:controller.signal,start:()=>launch(process.execPath,[fileURLToPath(new URL('./run.mjs',import.meta.url))],{cwd:process.cwd(),env:process.env,stdio:'inherit'})});
}
