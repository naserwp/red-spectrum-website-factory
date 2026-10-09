import "server-only";
import { randomBytes } from "node:crypto";
import { database,digest,secureEqual } from "./server";
import { workerStages,allowedBuildPath,workerInput,qaMessages } from "./worker-contract";
import { requiredBuildChecks } from "./build-executor";
import {verifyProtectedPreview} from './preview-verification';
import {getCustomerSites} from '@/lib/customers/registry';
import {verifiedBuildEvidence} from './build-evidence';
import type { z } from "zod";
export function workerAuthorized(header:string|null){const secret=process.env.WEBFACTORY_BUILD_WORKER_SECRET;return Boolean(secret && secret.length>=32 && header?.startsWith("Bearer ") && secureEqual(header.slice(7),secret));}
export async function getVerifiedWorkerBuild(requestId:string,slug:string,briefId:string,url?:string|null){
 try{
   const candidates=(await database().query("SELECT j.*,r.business FROM webfactory.website_build_jobs j JOIN webfactory.requests r ON r.id=j.request_id JOIN webfactory.build_workflows w ON w.request_id=r.id WHERE j.request_id=$1 AND j.customer_slug=$2 AND r.customer_slug=$2 AND j.brief_id=$3 AND w.active_brief_id=$3 AND j.status='ready_for_review' AND ($4::text IS NULL OR j.preview_url=$4) ORDER BY j.created_at DESC",[requestId,slug,briefId,url || null])).rows;
   for(const candidate of candidates){
    const verified=verifiedBuildEvidence(candidate,{requestId,slug,briefId});
    if(verified)return verified;
   }
   return null;
 }catch{return null;}
}
export async function getVerifiedWorkerPreview(requestId:string,slug:string,briefId:string,url?:string|null):Promise<string|null>{
 return (await getVerifiedWorkerBuild(requestId,slug,briefId,url))?.previewUrl || null;
}
async function verifyPreview(input:Extract<z.infer<typeof workerInput>,{action:"complete"}>,slug:string,business:string,privateValues:string[]=[]){
 if(!process.env.VERCEL_TOKEN || !requiredBuildChecks.every(key=>input.qa[key]===true))throw Error("Unverified");
 return verifyProtectedPreview({...input,slug,business},{otherNames:getCustomerSites().filter(c=>c.slug!==slug).map(c=>c.business.name),privateValues:[input.jobId,...privateValues],apiGet:async endpoint=>{const r=await fetch('https://api.vercel.com'+endpoint,{headers:{Authorization:`Bearer ${process.env.VERCEL_TOKEN}`},cache:'no-store',signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('Preview unavailable');return r.json();}});
}
export async function workerOperation(input:z.infer<typeof workerInput>){
 const db=database();
 if(input.action==='pulse'){
  await db.query("INSERT INTO webfactory.build_workers(worker_id) VALUES($1) ON CONFLICT(worker_id) DO UPDATE SET last_seen_at=now()",[input.workerId]);
  return {healthy:true};
 }
 if(input.action==="claim"){
  // Expired workers are fenced, not silently requeued: external side effects may already exist.
  await db.query("WITH expired AS (UPDATE webfactory.website_build_jobs SET status='failed',error_category='WORKER_LEASE_EXPIRED',finished_at=now() WHERE ($1::uuid IS NULL OR id=$1) AND lease_expires_at<now() AND status IN ('claimed','planning','generating','applying_changes','validating','building','qa_running','preview_deploying','preview_verifying') RETURNING id) INSERT INTO webfactory.website_build_job_events(job_id,status,code,actor) SELECT id,'failed','WORKER_LEASE_EXPIRED','worker-recovery' FROM expired",[input.jobId ?? null]);
 }
 const c=await db.connect();
 try{
  await c.query("BEGIN");
  if(input.action==="claim"){
   if(process.env.WEBFACTORY_BUILD_EXECUTOR!=="controlled-worker-v1")throw Error("Disabled");
   const job=(await c.query("SELECT * FROM webfactory.website_build_jobs WHERE ($1::uuid IS NULL OR id=$1) AND status='queued' AND executor='controlled-worker-v1' AND cancel_requested=false ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1",[input.jobId ?? null])).rows[0];
   if(!job){await c.query("COMMIT");return {job:null};}
   const current=(await c.query("SELECT r.customer_slug,r.business,r.industry,r.email,r.phone,w.active_brief_id,w.stage FROM webfactory.requests r JOIN webfactory.build_workflows w ON w.request_id=r.id WHERE r.id=$1",[job.request_id])).rows[0];
   if(!current || current.customer_slug!==job.customer_slug || current.active_brief_id!==job.brief_id || !["build_approved","preview_ready"].includes(current.stage)){
    await c.query("UPDATE webfactory.website_build_jobs SET status='failed',error_category='INPUT_CHANGED',finished_at=now() WHERE id=$1",[job.id]);
    await c.query("INSERT INTO webfactory.website_build_job_events(job_id,status,code,actor) VALUES($1,'failed','INPUT_CHANGED',$2)",[job.id,input.workerId]);await c.query("COMMIT");return {job:null};
   }
   const lease=randomBytes(32).toString("hex");
   await c.query("UPDATE webfactory.website_build_jobs SET status='claimed',worker_id=$2,lease_hash=$3,lease_expires_at=now()+interval '2 minutes',started_at=now(),progress_code='claimed' WHERE id=$1",[job.id,input.workerId,digest(lease)]);
   await c.query("INSERT INTO webfactory.website_build_job_events(job_id,status,code,actor) VALUES($1,'claimed','worker_claimed',$2)",[job.id,input.workerId]);await c.query("COMMIT");
   return {job:{id:job.id,requestId:job.request_id,customerSlug:job.customer_slug,briefId:job.brief_id,brief:job.approved_brief,instructionVersion:job.instruction_version,requestedChanges:job.requested_changes,business:current.business,industry:current.industry,contact:{email:current.email,phone:current.phone},resumeQa:job.qa_result?.resume===true,resumePreview:job.qa_result?.resumePreview===true,previewRecovery:job.qa_result?.previewRecovery,checkpoint:job.qa_result?.checkpoint},lease};
  }
  const j=(await c.query("SELECT * FROM webfactory.website_build_jobs WHERE id=$1 AND lease_hash=$2 AND lease_expires_at>now() AND status IN ('claimed','planning','generating','applying_changes','validating','building','qa_running','preview_deploying','preview_verifying') FOR UPDATE",[input.jobId,digest(input.lease)])).rows[0];
  if(!j)throw Error("Lease expired");
  if(input.action==="heartbeat"){
   const current=(await c.query("SELECT r.customer_slug,w.active_brief_id,w.stage FROM webfactory.requests r JOIN webfactory.build_workflows w ON w.request_id=r.id WHERE r.id=$1",[j.request_id])).rows[0];
   if(!current || current.customer_slug!==j.customer_slug || current.active_brief_id!==j.brief_id || !["build_approved","preview_ready"].includes(current.stage)){
    await c.query("UPDATE webfactory.website_build_jobs SET status='failed',error_category='INPUT_CHANGED',finished_at=now() WHERE id=$1",[j.id]);
    await c.query("INSERT INTO webfactory.website_build_job_events(job_id,status,code,actor) VALUES($1,'failed','INPUT_CHANGED',$2)",[j.id,j.worker_id]);await c.query("COMMIT");return {cancelRequested:true};
   }
   await c.query("UPDATE webfactory.website_build_jobs SET lease_expires_at=now()+interval '2 minutes' WHERE id=$1",[j.id]);await c.query("COMMIT");return {cancelRequested:j.cancel_requested};
  }
  if(j.cancel_requested && input.action!=="cancel_ack" && input.action!=="fail")throw Error("Cancellation pending");
  if(input.action==='qa_checkpoint'){
   if(j.status!=='building'||j.qa_result?.checkpoint)throw Error('Invalid checkpoint');
   await c.query("UPDATE webfactory.website_build_jobs SET qa_result=jsonb_set(qa_result,'{checkpoint}',$2::jsonb) WHERE id=$1",[j.id,JSON.stringify({artifactSha:input.artifactSha,baselineSha:input.baselineSha,provider:input.provider})]);
   await c.query('COMMIT');return {status:j.status};
  }
  if(input.action==='qa_report' || (input.action==='fail' && input.diagnostics)){
   if(j.status!=='qa_running')throw Error('Invalid diagnostic stage');
   const results=input.diagnostics!;
   if(input.action==='qa_report' && results.some(r=>r.status==='failed'))throw Error('Invalid success report');
   await c.query("UPDATE webfactory.website_build_jobs SET qa_result=jsonb_set(qa_result,'{attempts}',COALESCE(qa_result->'attempts','[]'::jsonb)||$2::jsonb) WHERE id=$1",[j.id,JSON.stringify([{results:results.map(r=>({...r,safe_message:r.status==='failed'?qaMessages[r.check_name]:'Check passed.'})),recorded_at:new Date().toISOString()}])]);
   if(input.action==='qa_report'){
    await c.query("INSERT INTO webfactory.website_build_job_events(job_id,status,code,actor) VALUES($1,'qa_running','qa_checks_passed',$2)",[j.id,j.worker_id]);
    await c.query('COMMIT');return {status:j.status};
   }
  }
  let status:string=j.status,code:string=j.progress_code;
  if(input.action==="cancel_ack"){if(!j.cancel_requested)throw Error("No cancellation");status="cancelled";code="cancel_acknowledged";}
  if(input.action==="fail"){
   if(input.commandFailure){
    if(j.status!=='building')throw Error('Invalid command diagnostic stage');
    await c.query("UPDATE webfactory.website_build_jobs SET qa_result=jsonb_set(qa_result,'{commandFailure}',$2::jsonb) WHERE id=$1",[j.id,JSON.stringify(input.commandFailure)]);
   }
   status="failed";code=input.code;
  }
  if(input.action==="progress"){
   const at=workerStages.indexOf(j.status);const resume=j.qa_result?.checkpoint&&j.status==='claimed'&&((j.qa_result?.resume===true&&input.stage==='qa_running')||(j.qa_result?.resumePreview===true&&j.qa_result?.previewRecovery&&input.stage==='preview_verifying'));
   if(!resume&&workerStages[at+1]!==input.stage)throw Error("Invalid transition");status=input.stage;code=input.stage;
  }
  if(input.action==="complete"){
     if(j.instruction_version==='customer-site-v2'){
      const results=j.qa_result?.attempts?.at(-1)?.results || [];
      if(results.some((r:{status:string})=>r.status!=='passed')||!['','/services','/about','/contact','/privacy'].every(page=>[320,375,768,1024,1440,1920].every(viewport=>results.some((r:{page:string;viewport:number;check_name:string;status:string})=>r.page===page&&r.viewport===viewport&&r.check_name==='mobile-overflow'&&r.status==='passed'))))throw Error('Six-width QA required');
     }
   if(j.status!=="preview_verifying" || input.branch!==`webfactory/build/${j.id}-${j.customer_slug}` || !input.changedFiles.every(file=>allowedBuildPath(j.customer_slug,file)))throw Error("Invalid artifacts");
   if(j.qa_result?.resumePreview){
    const saved=j.qa_result.previewRecovery;
    if(!saved||saved.artifactSha!==j.qa_result.checkpoint?.artifactSha||input.baselineSha!==j.qa_result.checkpoint?.baselineSha||input.resultSha!==saved.deployment?.sha||input.deploymentReference!==saved.deployment?.reference||input.previewUrl!==saved.deployment?.url+'/'+j.customer_slug||!requiredBuildChecks.every(key=>saved.qa?.[key]===true))throw Error('Recovery artifact mismatch');
   }
   const current=(await c.query("SELECT r.business,r.customer_slug,w.active_brief_id FROM webfactory.requests r JOIN webfactory.build_workflows w ON w.request_id=r.id WHERE r.id=$1",[j.request_id])).rows[0];
   if(current.customer_slug!==j.customer_slug || current.active_brief_id!==j.brief_id)throw Error("Input changed");
   const access=await verifyPreview(input,j.customer_slug,current.business,[j.request_id,j.brief_id]);
   await c.query("UPDATE webfactory.website_build_jobs SET qa_result=jsonb_set(qa_result,'{preview_access}',$2::jsonb) WHERE id=$1",[j.id,JSON.stringify(access)]);
   status="ready_for_review";code="preview_verified";
   await c.query("UPDATE webfactory.website_build_jobs SET baseline_sha=$2,result_sha=$3,build_branch=$4,changed_files=$5,qa_result=qa_result||$6::jsonb,preview_url=$7,deployment_reference=$8,provider_metadata=$9 WHERE id=$1",[j.id,input.baselineSha,input.resultSha,input.branch,JSON.stringify(input.changedFiles),JSON.stringify(input.qa),input.previewUrl,input.deploymentReference,JSON.stringify(input.provider)]);
   await c.query("INSERT INTO webfactory.request_actions(request_id,actor,action,status_before,status_after,customer_slug,preview_url,notes) VALUES($1,$2,'website_built','build_approved','build_approved',$3,$4,'Worker QA and isolated deployment identity verified; admin readiness remains separate.')",[j.request_id,j.worker_id,j.customer_slug,input.previewUrl]);
  }
  await c.query("UPDATE webfactory.website_build_jobs SET status=$2,progress_code=$3,error_category=CASE WHEN $2='failed' THEN $3 ELSE error_category END,finished_at=CASE WHEN $2 IN ('failed','cancelled','ready_for_review') THEN now() ELSE NULL END WHERE id=$1",[j.id,status,code]);
  await c.query("INSERT INTO webfactory.website_build_job_events(job_id,status,code,actor) VALUES($1,$2,$3,$4)",[j.id,status,code,j.worker_id]);
  await c.query("COMMIT");return {status};
 }catch(error){await c.query("ROLLBACK");throw error;}finally{c.release();}
}
