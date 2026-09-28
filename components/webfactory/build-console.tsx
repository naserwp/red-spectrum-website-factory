"use client";
import { useCallback, useEffect, useRef, useState } from "react";
type Job={id:string;customer_slug:string;status:string;error_category:string|null;created_at:string;progress_code:string;preview_url:string|null};
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
  async function run(jobId?:string){
    if(pending || !confirmed)return;
    setPending(true);setError("");
    submission.current??=crypto.randomUUID();
    try{
      const response=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(jobId?{action:"cancel",jobId,confirmed:true}:{action:"create",submissionId:submission.current,confirmed:true,requestedChanges:changes})});
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
      {job.error_category==="BUILD_EXECUTOR_NOT_CONFIGURED" && <p>Authorization, saved slug and approved brief were recorded. No files were created. Lint, build, QA and preview deployment were not run. Connect a controlled repository worker with an executor adapter.</p>}
      {job.status==="ready_for_review" && job.preview_url && <a className="wf-button" href={job.preview_url} target="_blank" rel="noreferrer">Open verified preview</a>}
      {job.status==="ready_for_review" && <p>Ready for admin review. <a href={`/admin/requests/${requestId}#preview`}>Review / Mark Preview Ready</a>, or enter requested changes above. Customer approval is not automatic.</p>}
      <button className="wf-button secondary" disabled={!confirmed || pending || ["failed","cancelled","ready_for_review","changes_requested"].includes(job.status)} onClick={()=>void run(job.id)}>Cancel Build</button>
      <details><summary>View safe logs</summary><ul>{events.filter(e=>e.job_id===job.id).map((e,i)=><li key={i}>{new Date(e.created_at).toLocaleString()} · {e.code.replaceAll("_"," ")}</li>)}</ul></details>
    </article>)}</div>
    <p>Generation → isolated changes → lint/build → tenant & mobile QA → isolated preview → identity verification → ready for admin review. Only recorded results count as completed. Preview Ready and Customer Approved remain separate admin decisions.</p>
  </section>;
}
