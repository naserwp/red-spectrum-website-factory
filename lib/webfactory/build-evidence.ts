import {workerInput,allowedBuildPath} from './worker-contract';
import {requiredBuildChecks} from './build-executor';
import {validRecoveryEvidenceRecord} from './recovery-evidence';
export type VerifiedBuild = {jobId:string;previewUrl:string;protection:'protected'|'public';qaPassed:true};
// Only server-recorded completed evidence for the CURRENT request/slug/brief counts.
// Browser input, a URL alone, a website_built log, or an unfinished job is not proof.
export function verifiedBuildEvidence(job:Record<string,unknown>,context:{requestId:string;slug:string;briefId:string}):VerifiedBuild|null{
 try{
  if(job.status!=='ready_for_review'||job.request_id!==context.requestId||job.customer_slug!==context.slug||job.brief_id!==context.briefId) return null;
  const qa=job.qa_result as Record<string,unknown>,access=qa?.preview_access as Record<string,unknown>;
  if(!requiredBuildChecks.every(k=>qa?.[k]===true)||access?.preview_deployment_exists!==true||access.preview_authenticated_access_verified!==true||access.preview_customer_identity_verified!==true||!['protected','public'].includes(String(access.preview_public_access)))return null;
  if(JSON.stringify(access.pages)!==JSON.stringify(['/','/services','/about','/contact','/privacy']))return null;
  const attempts=qa.attempts as {results:{status:string}[]}[]|undefined;
  if(attempts?.length&&(!attempts.at(-1)?.results.length||attempts.at(-1)?.results.some(r=>r.status!=='passed')))return null;
   const branch=`webfactory/build/${job.id}-${context.slug}`;
   const recovery=validRecoveryEvidenceRecord(qa?.recovery_evidence,{requestId:context.requestId,slug:context.slug,revisionId:String(job.id),commit:String(job.result_sha),branch,changedFiles:job.changed_files});
   const parsed=recovery?null:workerInput.safeParse({action:'complete',jobId:job.id,lease:'0'.repeat(64),baselineSha:job.baseline_sha,resultSha:job.result_sha,branch:job.build_branch,changedFiles:job.changed_files,previewUrl:job.preview_url,deploymentReference:job.deployment_reference,qa:Object.fromEntries(requiredBuildChecks.map(k=>[k,qa[k]])),provider:job.provider_metadata});
   if(job.build_branch!==branch||(!recovery&&(!parsed?.success||parsed.data.action!=='complete'||!parsed.data.changedFiles.every(file=>allowedBuildPath(context.slug,file)))))return null;
  const url=new URL(String(job.preview_url));
  if(url.protocol!=='https:'||!/^[a-z0-9-]+\.vercel\.app$/.test(url.hostname)||url.username||url.password||url.port||url.search||url.hash||url.pathname!==`/${context.slug}`)return null;
  return {jobId:String(job.id),previewUrl:url.href,protection:access.preview_public_access as 'protected'|'public',qaPassed:true};
 }catch{return null;}
}
