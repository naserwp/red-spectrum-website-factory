import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {lstat,readFile,realpath} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {classifyRecoveryEvidence,recoveryEvidenceVersion} from '../../lib/webfactory/recovery-evidence.ts';
import {fingerprint} from './checkpoint.mjs';
const exec=promisify(execFile);
const git=async(cwd,args,encoding='utf8')=>{const stdout=(await exec('git',args,{cwd,encoding,maxBuffer:16*1024*1024})).stdout;return typeof stdout==='string'?stdout.trim():stdout;};
const inside=(root,target)=>{const relative=path.relative(root,target);return relative!==''&&!relative.startsWith('..'+path.sep)&&relative!=='..'&&!path.isAbsolute(relative);};
const fail=()=>{throw Error('RECOVERY_EVIDENCE_REJECTED');};

export async function collectRecoveryEvidence(workspace,slug,baseCommit,commit){
 const changed=(await git(workspace,['diff','--name-only',baseCommit,commit])).split(/\r?\n/).filter(Boolean);
 return changed.filter(file=>classifyRecoveryEvidence(slug,file)!=='FORBIDDEN').sort();
}

export async function verifyRecoveryEvidence(input,options={}){
 try{
  const {workspaceRoot,allowedRoot,requestId,expectedRequestId,slug,expectedSlug,revisionId,expectedRevisionId,commit,expectedCommit,artifactFingerprint,expectedArtifactFingerprint,evidenceFiles}=input;
  if(requestId!==expectedRequestId||slug!==expectedSlug||revisionId!==expectedRevisionId||commit!==expectedCommit||artifactFingerprint!==expectedArtifactFingerprint||!/^[-a-f0-9]{36}$/.test(requestId)||!/^[-a-f0-9]{36}$/.test(revisionId)||!/^[-a-f0-9]{40}$/.test(commit)||!/^[-a-f0-9]{64}$/.test(artifactFingerprint))fail();
  const allowed=await realpath(allowedRoot),workspace=await realpath(workspaceRoot),expected=path.resolve(allowed,revisionId);
  if(workspace!==expected||!inside(allowed,workspace)||(await lstat(workspaceRoot)).isSymbolicLink()||(await lstat(allowedRoot)).isSymbolicLink())fail();
  if(path.resolve(await git(workspace,['rev-parse','--show-toplevel']))!==workspace||await git(workspace,['rev-parse','HEAD'])!==commit||await git(workspace,['branch','--show-current'])!==`webfactory/build/${revisionId}-${slug}`||await git(workspace,['status','--porcelain','--untracked-files=all']))fail();
  if(!Array.isArray(evidenceFiles)||!evidenceFiles.length||evidenceFiles.length>100||new Set(evidenceFiles).size!==evidenceFiles.length||JSON.stringify(evidenceFiles)!==JSON.stringify([...evidenceFiles].sort()))fail();
  const files=[];
  for(const file of evidenceFiles){
   const classification=classifyRecoveryEvidence(slug,file);if(classification==='FORBIDDEN')fail();
   const absolute=path.resolve(workspace,file),canonical=await realpath(absolute),stat=await lstat(absolute);
   if(!inside(workspace,canonical)||canonical!==absolute||stat.isSymbolicLink()||!stat.isFile())fail();
   const entry=await git(workspace,['ls-tree',commit,'--',file]);const match=entry.match(/^100\d{3} blob ([a-f0-9]{40})\t/);if(!match)fail();
   const committed=await git(workspace,['show',`${commit}:${file}`],'buffer');const current=await readFile(absolute);if(!Buffer.from(committed).equals(current))fail();
   if(file==='components/generated-site.tsx'&&!current.toString('utf8').includes(slug))fail();
   files.push({path:file,classification,blobSha:match[1]});
  }
  const calculate=options.fingerprint||fingerprint;if(await calculate(workspace)!==artifactFingerprint)fail();
  return {version:recoveryEvidenceVersion,readOnly:true,requestId,customerSlug:slug,revisionId,commit,artifactFingerprint,branch:`webfactory/build/${revisionId}-${slug}`,files,provenance:{kind:'existing-reviewed-immutable-artifact',repository:'naserwp/red-spectrum-website-factory',verifiedAt:new Date().toISOString(),newGeneration:false}};
 }catch(error){if(error?.message==='RECOVERY_EVIDENCE_REJECTED')throw error;throw Error('RECOVERY_EVIDENCE_REJECTED');}
}

export function sha256(value){return createHash('sha256').update(value).digest('hex');}
