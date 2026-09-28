import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,symlink,unlink} from 'node:fs/promises';
import path from 'node:path';
import {saveCheckpoint,loadCheckpoint,fingerprint} from './build-worker/checkpoint.mjs';
import {command} from './build-worker/runtime.mjs';
await mkdir('work',{recursive:true});const dir=await mkdtemp(path.resolve('work/qa-checkpoint-test-'));
await command('git',['init'],dir);await mkdir(path.join(dir,'.next'),{recursive:true});
await writeFile(path.join(dir,'.gitignore'),'.next/\n');await writeFile(path.join(dir,'source.txt'),'synthetic source');await writeFile(path.join(dir,'.next/BUILD_ID'),'synthetic-build');
const job={id:'synthetic-checkpoint',customerSlug:'synthetic'},repo={dir,baseline:'a'.repeat(40)},provider={name:'openai',model:'synthetic'};
const c=await saveCheckpoint(repo,job,['source.txt'],provider);job.checkpoint={artifactSha:c.artifactSha,baselineSha:c.baseline,provider};
assert.equal((await loadCheckpoint(dir,job)).artifactSha,c.artifactSha);
await assert.rejects(()=>loadCheckpoint(dir,{...job,customerSlug:'other'}));
await writeFile(path.join(dir,'source.txt'),'changed source');await assert.rejects(()=>loadCheckpoint(dir,job));
await writeFile(path.join(dir,'source.txt'),'synthetic source');await writeFile(path.join(dir,'.next/BUILD_ID'),'changed-build');await assert.rejects(()=>loadCheckpoint(dir,job));
console.log('PASS: same artifact accepted; wrong customer, changed source and changed compiled artifact refused. Synthetic fixture retained.');
await writeFile(path.join(dir,'.gitignore'),'.next/\nnode_modules/\n.env*\n');
await mkdir(path.join(dir,'node_modules/pg'),{recursive:true});
await writeFile(path.join(dir,'node_modules/pg/index.js'),'export default 1');
await mkdir(path.join(dir,'.next/node_modules'),{recursive:true});
const link=path.join(dir,'.next/node_modules/pg-587764f78a6c7a9c');
const kind=process.platform==='win32'?'junction':'dir';
await symlink(path.join(dir,'node_modules/pg'),link,kind);
const internal=await fingerprint(dir);
await writeFile(path.join(dir,'node_modules/pg/index.js'),'export default 2');
assert.notEqual(await fingerprint(dir),internal,'dependency bytes must be immutable too');
await unlink(link);
const external=await mkdtemp(path.resolve('work/checkpoint-other-job-'));
await mkdir(path.join(dir,'node_modules/.env.private'),{recursive:true});
for(const [name,target] of [
 ['relative escape',path.relative(path.dirname(link),external)],
 ['absolute external',external],
 ['main checkout',process.cwd()],
 ['other job workspace',external],
 ['secret location',path.join(dir,'node_modules/.env.private')],
 ['config location',path.join(dir,'.git')],
 ['broken link',path.join(dir,'node_modules/missing')],
 ['internal source not dependency',path.join(dir,'.next')],
]){
 await symlink(target,link,kind);
 await assert.rejects(()=>fingerprint(dir),/SCOPE_REJECTED/,name);
 await unlink(link);
 console.log('PASS rejected: '+name);
}
await symlink(path.join(dir,'node_modules/pg'),link,kind);
await symlink(path.join(dir,'node_modules/pg'),path.join(dir,'node_modules/pg/cycle'),kind);
await assert.rejects(()=>fingerprint(dir),/SCOPE_REJECTED/,'dependency cycle');
await unlink(path.join(dir,'node_modules/pg/cycle'));
await fingerprint(dir);
await symlink(external,path.join(dir,'.next/cache'),kind);
await assert.rejects(()=>fingerprint(dir),/SCOPE_REJECTED/,'excluded cache escape still refused');
await unlink(path.join(dir,'.next/cache'));
await symlink(path.join(dir,'node_modules/pg'),path.join(dir,'source-link'),kind);
await assert.rejects(()=>fingerprint(dir),/SCOPE_REJECTED/,'source links stay forbidden');
await unlink(path.join(dir,'source-link'));
console.log('PASS: internal Next dependency link/junction accepted; dependency mutation and cycles rejected; external/junction, secret, config, broken and source targets blocked.');
