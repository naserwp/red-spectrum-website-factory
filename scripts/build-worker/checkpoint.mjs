import {createHash} from 'node:crypto';
import {readFile,writeFile,readdir,lstat} from 'node:fs/promises';
import path from 'node:path';
import {command} from './runtime.mjs';
async function fingerprint(dir){
 const files=(await command('git',['ls-files','--cached','--others','--exclude-standard'],dir)).split('\n').filter(Boolean);
 async function walk(relative){for(const entry of await readdir(path.join(dir,relative),{withFileTypes:true})){
  if(relative==='.next'&&entry.name==='cache')continue;
  const file=relative+'/'+entry.name;if(entry.isSymbolicLink())throw Error('SCOPE_REJECTED');
  if(entry.isDirectory())await walk(file);else files.push(file);
 }}
 await walk('.next');const hash=createHash('sha256');
 for(const file of [...new Set(files)].sort()){if((await lstat(path.join(dir,file))).isSymbolicLink())throw Error('SCOPE_REJECTED');hash.update(file+'\0');hash.update(await readFile(path.join(dir,file)));}
 return hash.digest('hex');
}
export async function saveCheckpoint(repo,job,files,provider){
 const checkpoint={jobId:job.id,slug:job.customerSlug,baseline:repo.baseline,files,provider,artifactSha:await fingerprint(repo.dir)};
 await writeFile(path.join(repo.dir,'.git/webfactory-qa.json'),JSON.stringify(checkpoint),{flag:'wx'});
 return checkpoint;
}
export async function loadCheckpoint(dir,job){
 const c=JSON.parse(await readFile(path.join(dir,'.git/webfactory-qa.json'),'utf8'));
 if(c.jobId!==job.id||c.slug!==job.customerSlug||c.artifactSha!==job.checkpoint?.artifactSha||c.baseline!==job.checkpoint?.baselineSha||JSON.stringify(c.provider)!==JSON.stringify(job.checkpoint?.provider)||await fingerprint(dir)!==c.artifactSha)throw Error('SCOPE_REJECTED');
 return c;
}
