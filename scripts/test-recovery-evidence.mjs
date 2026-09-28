import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm,rename,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {randomUUID} from 'node:crypto';
import {verifyRecoveryEvidence} from './build-worker/recovery-evidence.mjs';
import {fingerprint} from './build-worker/checkpoint.mjs';
import {classifyRecoveryEvidence} from '../lib/webfactory/recovery-evidence.ts';
import {customerBuildPath} from '../lib/webfactory/build-paths.ts';
const exec=promisify(execFile),run=(cwd,args)=>exec('git',args,{cwd});
const root=await mkdtemp(path.join(tmpdir(),'wf-recovery-root-')),revision=randomUUID(),request=randomUUID(),slug='synthetic-studio',workspace=path.join(root,revision);
const files=[
 'components/generated-site.tsx',`components/synthetic-studio.tsx`,`customers/${slug}/delivery/research.md`,`customers/${slug}/site/customer.config.json`,'customers/manifest.json',`public/customers/${slug}/logo.svg`,`scripts/verify-synthetic-studio.mjs`
].sort();
try{
 await mkdir(workspace,{recursive:true});await run(workspace,['init']);await run(workspace,['config','user.email','test@example.invalid']);await run(workspace,['config','user.name','Recovery test']);await writeFile(path.join(workspace,'.gitignore'),'.next/\n');
 for(const file of files){await mkdir(path.dirname(path.join(workspace,file)),{recursive:true});await writeFile(path.join(workspace,file),file==='customers/manifest.json'?'[]':`evidence for ${slug}`);}
 await mkdir(path.join(workspace,'.next'),{recursive:true});await writeFile(path.join(workspace,'.next','artifact'),'immutable');
 await run(workspace,['add','.']);await run(workspace,['commit','-m','fixture']);const commit=(await run(workspace,['rev-parse','HEAD'])).stdout.trim();await run(workspace,['branch','-M',`webfactory/build/${revision}-${slug}`]);
 const artifactFingerprint=await fingerprint(workspace),base={workspaceRoot:workspace,allowedRoot:root,requestId:request,expectedRequestId:request,slug,expectedSlug:slug,revisionId:revision,expectedRevisionId:revision,commit,expectedCommit:commit,artifactFingerprint,expectedArtifactFingerprint:artifactFingerprint,evidenceFiles:files};
 const record=await verifyRecoveryEvidence(base);assert.equal(record.files.length,files.length);assert.equal(record.readOnly,true);
 assert.equal(classifyRecoveryEvidence(slug,`components/${slug}.tsx`),'RECOVERY_EVIDENCE_ONLY');assert.equal(customerBuildPath(slug,`components/${slug}.tsx`),false,'recovery scope must not broaden worker writes');
 for(const [name,change] of [
  ['traversal',{evidenceFiles:['../outside']}],['absolute',{evidenceFiles:[path.resolve(root,'outside')]}],['another customer',{evidenceFiles:['public/customers/other/logo.svg']}],['env',{evidenceFiles:['.env']}],['credentials',{evidenceFiles:['credentials.json']}],['secrets',{evidenceFiles:[`customers/${slug}/secrets.txt`]}],['wrong slug',{expectedSlug:'other'}],['wrong request',{expectedRequestId:randomUUID()}],['wrong commit',{expectedCommit:'f'.repeat(40)}]
 ])await assert.rejects(()=>verifyRecoveryEvidence({...base,...change}),/RECOVERY_EVIDENCE_REJECTED/,name);
 await assert.rejects(()=>verifyRecoveryEvidence({...base,workspaceRoot:process.cwd()}),/RECOVERY_EVIDENCE_REJECTED/,'main checkout escape');
 const other=await mkdtemp(path.join(tmpdir(),'wf-other-workspace-'));await assert.rejects(()=>verifyRecoveryEvidence({...base,workspaceRoot:other}),/RECOVERY_EVIDENCE_REJECTED/,'another workspace');await rm(other,{recursive:true,force:true});
 await writeFile(path.join(workspace,'.next','artifact'),'modified after fingerprinting');await assert.rejects(()=>verifyRecoveryEvidence(base),/RECOVERY_EVIDENCE_REJECTED/,'artifact modified after fingerprinting');await writeFile(path.join(workspace,'.next','artifact'),'immutable');
 const customerDir=path.join(workspace,'public','customers',slug),saved=customerDir+'-saved',external=await mkdtemp(path.join(tmpdir(),'wf-junction-target-'));await rename(customerDir,saved);
 try{await symlink(external,customerDir,'junction');await assert.rejects(()=>verifyRecoveryEvidence(base),/RECOVERY_EVIDENCE_REJECTED/,'unsafe symlink/junction');}finally{await rm(customerDir,{recursive:true,force:true});await rename(saved,customerDir);await rm(external,{recursive:true,force:true});}
 console.log('PASS: read-only exact-commit recovery evidence; traversal, external/other workspace, cross-customer, env/credentials/secrets, wrong identity/commit, mutation and symlink/junction rejected; worker write scope unchanged.');
}finally{await rm(root,{recursive:true,force:true});}
