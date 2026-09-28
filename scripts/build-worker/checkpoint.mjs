import {createHash} from 'node:crypto';
import {readFile,writeFile,readdir,lstat,realpath} from 'node:fs/promises';
import path from 'node:path';
import {command} from './runtime.mjs';
const inside=(root,target)=>{const relative=path.relative(root,target);return relative!==''&&relative!=='..'&&!relative.startsWith('..'+path.sep)&&!path.isAbsolute(relative);};
const forbidden=relative=>relative.split(/[\\/]/).some(part=>/^\.(?:env(?:\..*)?|git|ssh|aws|npmrc|netrc)$/i.test(part)||/^(?:credentials|secrets?)(?:\.|$)/i.test(part));
export async function fingerprint(dir){
 const root=await realpath(dir),hash=createHash('sha256');
 hash.update('webfactory-checkpoint-v2\0');
 const files=(await command('git',['ls-files','--cached','--others','--exclude-standard'],dir)).split('\n').filter(Boolean);
 let entries=0;
 async function visit(absolute,label,dependencies=false,ancestors=new Set(),record=true){
  if(++entries>200000)throw Error('SCOPE_REJECTED');
  let canonical,stat;try{canonical=await realpath(absolute);stat=await lstat(absolute);}catch{throw Error('SCOPE_REJECTED');}
  if(!inside(root,canonical)||(dependencies&&forbidden(path.relative(root,canonical))))throw Error('SCOPE_REJECTED');
  if(stat.isSymbolicLink()){
   // Only framework dependency links, never source links or arbitrary internal targets.
   if(!dependencies||!inside(path.join(root,'node_modules'),canonical))throw Error('SCOPE_REJECTED');
   if(record)hash.update('link\0'+label+'\0'+path.relative(root,canonical).replaceAll('\\','/')+'\0');
   stat=await lstat(canonical);
  }else if(path.relative(absolute,canonical)!=='')throw Error('SCOPE_REJECTED');
  if(stat.isDirectory()){
   if(ancestors.has(canonical))throw Error('SCOPE_REJECTED');
   const next=new Set(ancestors).add(canonical);
   for(const entry of (await readdir(canonical)).sort()){
    await visit(path.join(canonical,entry),label+'/'+entry,dependencies||label==='.next/node_modules',next,record&&!(label==='.next'&&entry==='cache'));
   }
  }else if(stat.isFile()){
   if(record){hash.update('file\0'+label+'\0');hash.update(await readFile(canonical));hash.update('\0');}
  }else throw Error('SCOPE_REJECTED');
 }
 for(const file of [...new Set(files)].sort())await visit(path.resolve(root,file),file);
 await visit(path.join(root,'.next'),'.next');
 return hash.digest('hex');
}
export async function saveCheckpoint(repo,job,files,provider){
 await checkpointDirectory(repo.dir);
 const checkpoint={version:2,jobId:job.id,slug:job.customerSlug,baseline:repo.baseline,files,provider,artifactSha:await fingerprint(repo.dir)};
 await writeFile(path.join(repo.dir,'.git/webfactory-qa.json'),JSON.stringify(checkpoint),{flag:'wx'});
 return checkpoint;
}
export async function loadCheckpoint(dir,job){
 await checkpointDirectory(dir);
 const c=JSON.parse(await readFile(path.join(dir,'.git/webfactory-qa.json'),'utf8'));
 if(c.version!==2||c.jobId!==job.id||c.slug!==job.customerSlug||c.artifactSha!==job.checkpoint?.artifactSha||c.baseline!==job.checkpoint?.baselineSha||JSON.stringify(c.provider)!==JSON.stringify(job.checkpoint?.provider)||await fingerprint(dir)!==c.artifactSha)throw Error('SCOPE_REJECTED');
 return c;
}
async function checkpointDirectory(dir){
 const root=await realpath(dir),git=path.join(root,'.git');
 if((await lstat(git)).isSymbolicLink()||await realpath(git)!==git)throw Error('SCOPE_REJECTED');
 const file=path.join(git,'webfactory-qa.json');
 try{if((await lstat(file)).isSymbolicLink())throw Error('SCOPE_REJECTED');}catch(e){if(e.code!=='ENOENT')throw e;}
}
