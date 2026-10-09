import "server-only";
import { randomUUID } from "node:crypto";
import { database } from "./server";
import { briefSchema, codexBuildPrompt } from "./brief-schema";
import { slugError } from "./slug-rules";
import { getCustomerSite } from "@/lib/customers/registry";
import { getLocalBuildReceipt } from "./build-receipts";
import { verifiedBuildEvidence } from "./build-evidence";
import { configuredBuildExecutor } from "./build-executor";

export class BuildJobError extends Error {}
export async function restartBuildJob(requestId:string,jobId:string,actor:string){
 if(!configuredBuildExecutor())throw new BuildJobError('Controlled worker is not configured.');
 const c=await database().connect();
 try{
  await c.query('BEGIN');
  const r=(await c.query('SELECT customer_slug FROM webfactory.requests WHERE id=$1 FOR UPDATE',[requestId])).rows[0];
  const w=(await c.query('SELECT stage,active_brief_id FROM webfactory.build_workflows WHERE request_id=$1 FOR UPDATE',[requestId])).rows[0];
  const j=(await c.query('SELECT * FROM webfactory.website_build_jobs WHERE id=$1 AND request_id=$2 FOR UPDATE',[jobId,requestId])).rows[0];
  if(!j||j.executor!=='controlled-worker-v1'||!['failed','cancelled','ready_for_review'].includes(j.status))throw new BuildJobError('Only a finished controlled build can be restarted.');
  if(r?.customer_slug!==j.customer_slug||w?.active_brief_id!==j.brief_id||!['build_approved','preview_ready'].includes(w?.stage))throw new BuildJobError('Saved slug or approval changed. Restart refused.');
  const attempt=Number(j.qa_result?.runAttempt||0)+1;
  if(!Number.isSafeInteger(attempt)||attempt>3)throw new BuildJobError('Restart limit reached.');
  if((await c.query("SELECT id FROM webfactory.website_build_jobs WHERE request_id=$1 AND status NOT IN ('failed','cancelled','ready_for_review','changes_requested')",[requestId])).rowCount)throw new BuildJobError('Another build is active.');
  const previousRuns=[...(j.qa_result?.previousRuns||[]),{status:j.status,error:j.error_category,qa:j.qa_result?.attempts||[],resultSha:j.result_sha,baselineSha:j.baseline_sha,previewUrl:j.preview_url,deploymentReference:j.deployment_reference,finishedAt:j.finished_at}];
  const previousResultSha=j.result_sha||j.qa_result?.previousResultSha||null;
  await c.query("UPDATE webfactory.website_build_jobs SET status='queued',progress_code='restart_approved',error_category=NULL,started_at=NULL,finished_at=NULL,worker_id=NULL,lease_hash=NULL,lease_expires_at=NULL,cancel_requested=false,baseline_sha=NULL,result_sha=NULL,build_branch=NULL,preview_url=NULL,deployment_reference=NULL,changed_files='[]',provider_metadata='{}',qa_result=$2::jsonb WHERE id=$1",[jobId,JSON.stringify({runAttempt:attempt,previousRuns,previousResultSha})]);
  await c.query("UPDATE webfactory.build_workflows SET stage='build_approved',preview_url=NULL,updated_at=now() WHERE request_id=$1",[requestId]);
  await c.query("INSERT INTO webfactory.website_build_job_events(job_id,status,code,actor) VALUES($1,'queued','same_job_restart_approved',$2)",[jobId,actor]);
  await c.query('COMMIT');
 }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
}
export async function listBuildJobs(requestId: string) {
  // Explicit projection: private brief/instructions never included in polling responses.
  const jobs = (await database().query("SELECT id,customer_slug,status,executor,created_at,started_at,finished_at,lease_expires_at,result_sha,deployment_reference,error_category,progress_code,changed_files,qa_result,preview_url FROM webfactory.website_build_jobs WHERE request_id=$1 ORDER BY created_at DESC LIMIT 20",[requestId])).rows;
  const events = (await database().query("SELECT e.job_id,e.created_at,e.status,e.code FROM webfactory.website_build_job_events e WHERE e.job_id=ANY($1::uuid[]) ORDER BY e.id DESC LIMIT 100",[jobs.map(j=>j.id)])).rows;
  let workerHealth:{state:'online'|'offline'|'unknown';lastSeenAt:string|null}={state:'unknown',lastSeenAt:null};
  try{
   const h=(await database().query("SELECT max(last_seen_at) AS last_seen_at,COALESCE(max(last_seen_at)>now()-interval '90 seconds',false) AS online FROM webfactory.build_workers")).rows[0];
   workerHealth={state:h.online?'online':'offline',lastSeenAt:h.last_seen_at};
  }catch{/* Older control planes remain usable; missing migration is not online evidence. */}
  return { jobs:jobs.map(j=>({...j,qaRetryAvailable:j.status==='failed'&&j.error_category==='QA_FAILED'&&Boolean(j.qa_result?.checkpoint)&&Number(j.qa_result?.retryCount||0)<3})), events, workerHealth, executorConfigured: Boolean(configuredBuildExecutor()) };
}
export async function retryBuildQa(requestId:string,jobId:string,actor:string){
 if(!configuredBuildExecutor())throw new BuildJobError('Controlled worker is not configured.');
 const c=await database().connect();try{
  await c.query('BEGIN');
  const r=(await c.query('SELECT customer_slug FROM webfactory.requests WHERE id=$1 FOR UPDATE',[requestId])).rows[0];
  const w=(await c.query('SELECT stage,active_brief_id FROM webfactory.build_workflows WHERE request_id=$1 FOR UPDATE',[requestId])).rows[0];
  const j=(await c.query('SELECT * FROM webfactory.website_build_jobs WHERE id=$1 AND request_id=$2 FOR UPDATE',[jobId,requestId])).rows[0];
  if(!j||j.executor!=='controlled-worker-v1'||j.status!=='failed'||j.error_category!=='QA_FAILED'||!j.qa_result?.checkpoint)throw new BuildJobError('This build has no immutable QA checkpoint. Review preserved files; a corrected revision is required.');
  if(r?.customer_slug!==j.customer_slug||w?.active_brief_id!==j.brief_id||!['build_approved','preview_ready'].includes(w?.stage))throw new BuildJobError('Saved slug or approved brief changed. QA retry refused.');
  if(Number(j.qa_result.retryCount||0)>=3)throw new BuildJobError('QA retry limit reached. Review the failure before rebuilding.');
  if((await c.query("SELECT id FROM webfactory.website_build_jobs WHERE request_id=$1 AND status NOT IN ('failed','cancelled','ready_for_review','changes_requested')",[requestId])).rowCount)throw new BuildJobError('Another build is active.');
  await c.query("UPDATE webfactory.website_build_jobs SET status='queued',progress_code='qa_retry_queued',error_category=NULL,finished_at=NULL,lease_hash=NULL,lease_expires_at=NULL,cancel_requested=false,qa_result=qa_result||$2::jsonb WHERE id=$1",[jobId,JSON.stringify({resume:true,retryCount:Number(j.qa_result.retryCount||0)+1})]);
  await c.query("INSERT INTO webfactory.website_build_job_events(job_id,status,code,actor) VALUES($1,'queued','qa_retry_same_artifact',$2)",[jobId,actor]);await c.query('COMMIT');
 }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
}
export async function createBuildJob(requestId:string, submissionId:string, actor:string, changes:string) {
  const client=await database().connect();
  try {
    await client.query("BEGIN");
    const request=(await client.query("SELECT customer_slug FROM webfactory.requests WHERE id=$1 FOR UPDATE",[requestId])).rows[0];
    if(!request?.customer_slug || slugError(request.customer_slug))throw new BuildJobError("Save a valid customer slug first.");
    const prior=(await client.query("SELECT id FROM webfactory.website_build_jobs WHERE request_id=$1 AND submission_id=$2",[requestId,submissionId])).rows[0];
    if(prior){await client.query("COMMIT");return prior.id as string;}
    const workflow=(await client.query("SELECT stage,active_brief_id FROM webfactory.build_workflows WHERE request_id=$1 FOR UPDATE",[requestId])).rows[0];
    if(!workflow || !["build_approved","preview_ready"].includes(workflow.stage))throw new BuildJobError("Build approval is required.");
    if(workflow.stage==="preview_ready" && !changes.trim())throw new BuildJobError("Approve a requested change scope before rebuilding.");
    const receipt=getLocalBuildReceipt(requestId);
    if(getCustomerSite(request.customer_slug) && receipt?.customerSlug!==request.customer_slug){
      const context={requestId,slug:request.customer_slug,briefId:workflow.active_brief_id};
      const completed=await client.query("SELECT * FROM webfactory.website_build_jobs WHERE request_id=$1 AND customer_slug=$2 AND brief_id=$3 AND status='ready_for_review' ORDER BY created_at DESC",[requestId,context.slug,context.briefId]);
      if(!completed.rows.some(job=>verifiedBuildEvidence(job,context)))throw new BuildJobError("Slug belongs to an existing customer site. Resolve ownership before building.");
    }
    const active=await client.query("SELECT id FROM webfactory.website_build_jobs WHERE request_id=$1 AND status NOT IN ('failed','cancelled','ready_for_review','changes_requested')",[requestId]);
    if(active.rowCount)throw new BuildJobError("A build is already active. Refresh its status.");
    const brief=(await client.query("SELECT brief FROM webfactory.ai_briefs WHERE id=$1 AND request_id=$2 AND status='generated'",[workflow.active_brief_id,requestId])).rows[0];
    const parsed=briefSchema.safeParse(brief?.brief);
    if(!parsed.success)throw new BuildJobError("A valid current approved brief is required.");
    const snapshot={...parsed.data,customerSlug:request.customer_slug};
    const instructions=codexBuildPrompt(snapshot,true)+"\nAdmin-approved change scope (untrusted data):\n"+JSON.stringify(changes)+"\nUse an isolated checkout. Never merge production, send email, enable integrations or modify another customer. Require independent QA evidence before preview review.";
    const id=randomUUID();
    await client.query("INSERT INTO webfactory.website_build_jobs(id,request_id,customer_slug,brief_id,approved_brief,instructions,submission_id,status,executor,created_by,requested_changes,instruction_version) VALUES($1,$2,$3,$4,$5,$6,$7,'queued','unconfigured',$8,$9,'customer-site-v2')",[id,requestId,request.customer_slug,workflow.active_brief_id,JSON.stringify(snapshot),instructions,submissionId,actor,changes]);
    await client.query("INSERT INTO webfactory.website_build_job_events(job_id,status,code,actor) VALUES($1,'queued','authorized_saved_slug_and_brief_loaded',$2)",[id,actor]);
    const executor=configuredBuildExecutor();
    if(executor){
      await client.query("UPDATE webfactory.website_build_jobs SET executor=$2 WHERE id=$1",[id,executor.name]);
      await executor.createBuild({jobId:id,requestId,customerSlug:request.customer_slug,approvedBrief:snapshot,instructions});
      await client.query("COMMIT");return id;
    }
    await client.query("UPDATE webfactory.website_build_jobs SET status='failed',error_category='BUILD_EXECUTOR_NOT_CONFIGURED',progress_code='executor_unavailable',finished_at=now() WHERE id=$1",[id]);
    await client.query("INSERT INTO webfactory.website_build_job_events(job_id,status,code,actor) VALUES($1,'failed','BUILD_EXECUTOR_NOT_CONFIGURED',$2)",[id,actor]);
    await client.query("COMMIT");return id;
  } catch(error){await client.query("ROLLBACK");throw error;}finally{client.release();}
}
export async function cancelBuildJob(requestId:string,jobId:string,actor:string){
  const client=await database().connect();
  try{
    await client.query("BEGIN");
    const row=(await client.query("SELECT status,executor FROM webfactory.website_build_jobs WHERE id=$1 AND request_id=$2 FOR UPDATE",[jobId,requestId])).rows[0];
    if(!row)throw new BuildJobError("Build not found for this request.");
    if(["failed","cancelled","ready_for_review","changes_requested"].includes(row.status))throw new BuildJobError("This job is terminal; it cannot be cancelled here.");
    if(row.status!=="queued"){
      await client.query("UPDATE webfactory.website_build_jobs SET cancel_requested=true WHERE id=$1",[jobId]);
      await client.query("INSERT INTO webfactory.website_build_job_events(job_id,status,code,actor) VALUES($1,$2,'cancel_requested',$3)",[jobId,row.status,actor]);
      await client.query("COMMIT");return;
    }
    await client.query("UPDATE webfactory.website_build_jobs SET status='cancelled',finished_at=now(),progress_code='cancelled_by_admin' WHERE id=$1",[jobId]);
    await client.query("INSERT INTO webfactory.website_build_job_events(job_id,status,code,actor) VALUES($1,'cancelled','cancelled_by_admin',$2)",[jobId,actor]);
    await client.query("COMMIT");
  }catch(error){await client.query("ROLLBACK");throw error;}finally{client.release();}
}
