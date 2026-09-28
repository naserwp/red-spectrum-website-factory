"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {qaMessages,type QaDiagnostic} from "@/lib/webfactory/qa-diagnostics";
type Job={id:string;customer_slug:string;status:string;error_category:string|null;created_at:string;progress_code:string;preview_url:string|null;qaRetryAvailable?:boolean;qa_result?:{preview_access?:{preview_public_access:'protected'|'public'};attempts?:{results:QaDiagnostic[];recorded_at:string}[]}};
type Event={job_id:string;created_at:string;status:string;code:string};
type Result={jobs?:Job[];events?:Event[];error?:string;executorConfigured?:boolean};
export function BuildConsole({requestId,enabled}:{requestId:string;enabled:boolean}){
  const [jobs,setJobs]=useState<Job[]>([]),[events,setEvents]=useState<Event[]>([]),[error,setError]=useState("");
  const [pending,setPending]=useState(false),[confirmed,setConfirmed]=useState(false),[changes,setChanges]=useState("");
  const [configured,setConfigured]=useState(false);
  const submission=useRef<string|null>(null);
  const endpoint=`/api/admin/requests/${requestId}/build-jobs`;
  const refresh=useCallback(async()=>{
    try{const response=await fetch(endpoint,{cache:"no-store"});const data=await response.json() as Result;if(!response.ok)throw Error(data.error);setJobs(data.jobs || []);setEvents(data.events || []);setConfigured(Boolean(data.executorConfigured));setError("");}catch{setError("Build history unavailable. Sign in and check database migration.");}
  },[endpoint]);
  useEffect(()=>{const initial=setTimeout(()=>void refresh(),0);const timer=setInterval(()=>void refresh(),10000);return()=>{clearTimeout(initial);clearInterval(timer);};},[refresh]);
  const active=jobs.some(job=>!["failed","cancelled","ready_for_review","changes_requested"].includes(job.status));
  async function run(jobId?:string,retryQa=false){
    if(pending || !confirmed)return;
    setPending(true);setError("");
    submission.current??=crypto.randomUUID();
    try{
      const response=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(jobId?{action:retryQa?"retry_qa":"cancel",jobId,confirmed:true}:{action:"create",submissionId:submission.current,confirmed:true,requestedChanges:changes})});
      const data=await response.json() as Result;
      if(!response.ok){setError(data.error || "Build request failed.");return;}
      setJobs(data.jobs || []);setEvents(data.events || []);submission.current=null;setConfirmed(false);
    }catch{setError("Connection interrupted. Refresh before retrying; the same submission will be reused.");}finally{setPending(false);}
  }
  return <section className="wf-panel" aria-label="Build console" style={{minWidth:0}}>
    <p className="wf-section-label">Build Engine / Private admin console</p>
    <h3>Build Customer Website</h3>
    <p>Creates a durable job using the saved slug and current approved brief. {configured?"The controlled worker will claim queued jobs. A queued job is not proof that a worker is online; follow the recorded progress below.":"Worker dispatch is not configured. Jobs report an explicit configuration failure, not a completed website."}</p>
    <label className="wf-field">Requested changes / approved rebuild scope<textarea value={changes} maxLength={6000} rows={3} onChange={e=>{setChanges(e.target.value);submission.current=null;}}/></label>
    <a href={`/admin/ai?requestId=${requestId}`}>Ask AI for a draft change plan</a>
    <label className="wf-check"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/><span>I approve this build and the change scope above using the saved request. No production merge or integration activation is authorized.</span></label>
    <div className="wf-buttons"><button className="wf-button" disabled={!enabled || !confirmed || pending || active} onClick={()=>void run()}>{pending?"Recording job…":changes.trim()?"REBUILD WEBSITE":"BUILD CUSTOMER WEBSITE"}</button><button className="wf-button secondary" onClick={()=>void refresh()}>Refresh Status</button></div>
    {!enabled && <p>Confirm a saved slug and approve the current brief first.</p>}
    {error && <p role="alert">{error}</p>}
    <div aria-live="polite">{jobs.length===0?<p>No build jobs recorded. Website generation has not started.</p>:jobs.map(job=><article className="wf-panel" key={job.id} style={{overflowWrap:"anywhere",minWidth:0}}>
      <h4>Build {job.id.slice(0,8)} · {job.customer_slug}</h4><p><strong>{job.error_category==="BUILD_EXECUTOR_NOT_CONFIGURED"?"BUILD EXECUTOR NOT CONFIGURED":job.status.replaceAll("_"," ")}</strong></p>
      <p>{new Date(job.created_at).toLocaleString()}</p>
      {job.error_category==='QA_FAILED' && <div role="status"><strong>Failed stage: QA</strong>{job.qa_result?.attempts?.at(-1)?.results.filter(r=>r.status==='failed').map((r,i)=><p key={i}>Failed check: {r.check_name} · {r.page||'/'}{r.viewport?` · ${r.viewport}px`:''}<br/>{qaMessages[r.check_name]}<br/><time>{new Date(r.timestamp).toLocaleString()}</time></p>)}{!job.qa_result?.attempts?.length&&<p>This older job did not retain assertion details. Diagnose the preserved artifact before retrying.</p>}</div>}
      {!!job.qa_result?.attempts?.length && <details><summary>View QA Results</summary>{job.qa_result.attempts.map((attempt,i)=><div key={i}><h5>Attempt {i+1}</h5><ul>{attempt.results.map((r,k)=><li key={k}>{r.status} · {r.check_name} · {r.page||'/'} · {r.viewport||'HTTP'} · {r.duration}ms — {r.status==='failed'?qaMessages[r.check_name]:'Check passed.'}</li>)}</ul></div>)}</details>}
      {job.error_category==='QA_FAILED' && (job.qaRetryAvailable?<><p>Retry verifies the same fingerprinted artifact. It does not regenerate files. If QA passes, the same job continues to isolated preview deployment.</p><button className="wf-button secondary" disabled={!confirmed||pending||active} onClick={()=>void run(job.id,true)}>Retry QA</button></>:<p>QA retry unavailable: this job has no eligible immutable checkpoint, or its retry limit was reached. A site defect requires a corrected build revision, not a bypass.</p>)}
      {job.error_category==="BUILD_EXECUTOR_NOT_CONFIGURED" && <p>Authorization, saved slug and approved brief were recorded. No files were created. Lint, build, QA and preview deployment were not run. Connect a controlled repository worker with an executor adapter.</p>}
      {job.status==="ready_for_review" && job.preview_url && <><a className="wf-button" href={`https://preview.redspectrum.ai/${job.customer_slug}`} target="_blank" rel="noreferrer">Open Customer Preview</a><p>Customer Preview: <strong>Verified — Ready for Review</strong></p><details><summary>Technical preview details</summary><p>Protected deployment: <code>{job.preview_url}</code></p><p>Access: {job.qa_result?.preview_access?.preview_public_access==='protected'?'Protected':'Public'}</p></details></>}
      {job.status==="ready_for_review" && <p>Ready for admin review. <a href={`/admin/requests/${requestId}#preview`}>Review / Mark Preview Ready</a>, or enter requested changes above. Customer approval is not automatic.</p>}
      {!["failed","cancelled","ready_for_review","changes_requested"].includes(job.status)&&<button className="wf-button secondary" disabled={!confirmed || pending} onClick={()=>void run(job.id)}>Cancel Build</button>}
      <details><summary>View safe logs</summary><ul>{events.filter(e=>e.job_id===job.id).map((e,i)=><li key={i}>{new Date(e.created_at).toLocaleString()} · {e.code.replaceAll("_"," ")}</li>)}</ul></details>
    </article>)}</div>
    <p>Generation → isolated changes → lint/build → tenant & mobile QA → isolated preview → identity verification → ready for admin review. Only recorded results count as completed. Preview Ready and Customer Approved remain separate admin decisions.</p>
  </section>;
}
