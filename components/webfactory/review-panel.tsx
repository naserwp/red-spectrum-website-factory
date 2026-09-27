"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ReviewEvent } from "@/lib/webfactory/reviews";
import { reviewActions } from "@/lib/webfactory/review-actions";

export function ReviewPanel({requestId,history,previewUrl,stage}:{requestId:string;history:ReviewEvent[];previewUrl?:string|null;stage:string}) {
  const router=useRouter(),latest=history.find(e=>e.kind==="review");
  const [url,setUrl]=useState(previewUrl || latest?.preview_url || ""),[notes,setNotes]=useState(latest?.notes || ""),[changes,setChanges]=useState(latest?.requested_changes || "");
  const [status,setStatus]=useState(latest?.review_status || (stage==="customer_approved"?"approved":stage==="preview_ready"?"preview_ready":stage==="build_approved"?"building":"draft"));
  const [pending,setPending]=useState(false),[message,setMessage]=useState("");
  async function save(nextStatus=status){
    if(pending)return;setPending(true);setMessage("");
    try{const response=await fetch("/api/admin/reviews",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:crypto.randomUUID(),requestId,kind:"review",status:nextStatus,previewUrl:url,notes,requestedChanges:changes,confirmed:true})});
      const result=await response.json() as {error?:string};if(!response.ok)throw new Error(result.error);setStatus(nextStatus);setMessage("Review saved. No brief, files or integrations changed.");router.refresh();
    }catch(e){setMessage(e instanceof Error?e.message:"Review unavailable.");}finally{setPending(false);}
  }
  return <section className="wf-panel wf-review-panel" id="review" aria-label="Admin preview review">
    <div><p className="wf-section-label">Review → changes → rebuild</p><h2>Shape the next version.</h2><p>Save your observations, ask AI for a draft, then explicitly approve the scope before running Codex. Nothing here edits files or deploys.</p><span className="wf-state-pill">{status.replaceAll("_"," ")}</span></div>
    <div className="wf-chat-actions">{reviewActions.map(([id,label])=><Link className="wf-button secondary" key={id} href={`/admin/ai?requestId=${requestId}&action=${id}`}>{label}</Link>)}</div>
    <form className="wf-form" onSubmit={e=>{e.preventDefault();void save();}}>
      <label className="wf-field">Preview URL<input type="url" value={url} onChange={e=>setUrl(e.target.value)} maxLength={500} placeholder="https://preview.redspectrum.ai/customer-slug"/></label>
      <div className="wf-review-fields"><label className="wf-field">Admin notes<textarea rows={5} maxLength={8000} value={notes} onChange={e=>setNotes(e.target.value)}/></label><label className="wf-field">Requested changes<textarea rows={5} maxLength={8000} value={changes} onChange={e=>setChanges(e.target.value)}/></label></div>
      <label className="wf-field">Review status<select value={status} onChange={e=>setStatus(e.target.value)}>{["draft","building","preview_ready","changes_requested","rebuilding","approved"].map(s=><option key={s} value={s}>{s.replaceAll("_"," ")}</option>)}</select></label>
      <p>Preview ready / approved can only be saved after the corresponding gated approval below. Changes requested / rebuilding reopens QA and customer approval. Saving notes does not approve a rebuild.</p>
      <div className="wf-chat-actions"><button className="wf-button" disabled={pending}>Save review</button><button className="wf-button secondary" type="button" disabled={pending || stage==="draft" || !changes.trim()} onClick={()=>save("changes_requested")}>Mark Changes Requested</button><Link className="wf-button secondary" href={`/admin/ai?requestId=${requestId}&action=rebuild`}>Generate Rebuild Prompt</Link><a className="wf-button secondary" href="#preview">Preview & customer approval controls ↓</a></div>
      {message&&<p role="status" className="wf-status">{message}</p>}
    </form>
    <details><summary>Review & change history · {history.length} recent records</summary><p>Saved records are shared with authorized admins. Original session chat stays private.</p>{history.map(item=><article className="wf-chat-message" key={item.id}><strong>{item.kind.replaceAll("_"," ")} · {item.review_status.replaceAll("_"," ")}</strong><small>{new Date(item.created_at).toISOString()}</small><p style={{whiteSpace:"pre-wrap"}}>{item.notes}{item.requested_changes?"\nRequested changes: "+item.requested_changes:""}</p>{item.content&&<><pre style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{item.content}</pre><button className="wf-button secondary" onClick={async()=>{try{await navigator.clipboard.writeText(item.content);setMessage("Saved output copied.");}catch{setMessage("Select the output to copy manually.");}}}>Copy saved output</button></>}</article>)}</details>
  </section>;
}
