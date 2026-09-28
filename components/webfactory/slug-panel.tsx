"use client";
import Link from "next/link";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {slugError,previewUrls,slugFromPreviewUrl} from "@/lib/webfactory/slug-rules";
export function SlugPanel({requestId,suggested,saved,locked}:{requestId:string;suggested:string;saved:string|null;locked:boolean}){
  const router=useRouter();const [value,setValue]=useState(saved || suggested),[pending,setPending]=useState(false),[message,setMessage]=useState("");
  const error=slugError(value),urls=previewUrls(value);
  function pasted(text:string){
    const detected=slugFromPreviewUrl(text);
    if(detected){setValue(detected);setMessage(`Detected slug: ${detected}. Save this slug?`);}
    else{setValue('');setMessage('Paste an exact HTTPS customer preview URL on an approved host, without a query, fragment or extra path. Nothing was saved.');}
  }
  async function run(action:'save'|'check'){
    if(error || pending)return;setPending(true);setMessage("");
    try{const response=await fetch(`/api/admin/requests/${requestId}/slug`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slug:value,action,expectedSlug:saved})});const result=await response.json() as {error?:string;available?:boolean};if(!response.ok)throw Error(result.error);setMessage(action==='save'?"Slug confirmed. The build prompt now uses this address. No route was created or deployed.":result.available?"Available now. Save Slug to reserve it.":"Unavailable: another customer/request owns it, or this built route is locked.");if(action==='save')router.refresh();}catch(e){setMessage(e instanceof Error?e.message:'Slug service unavailable.');}finally{setPending(false);}
  }
  return <section className="wf-panel wf-slug-panel" id="customer-slug"><p className="wf-section-label">Choose the customer address</p><h2>Customer Slug</h2><p>AI suggestion: <code>{suggested}</code>. {saved?<>Confirmed: <strong>{saved}</strong>.</>:"Not confirmed yet."}</p>
    <form className="wf-form" onSubmit={e=>{e.preventDefault();void run('save');}}><label className="wf-field">Customer slug<input value={value} onChange={e=>{setValue(e.target.value);setMessage('');}} onPaste={e=>{const text=e.clipboardData.getData('text');if(text.includes('://')){e.preventDefault();pasted(text);}}} maxLength={80} spellCheck={false} autoCapitalize="none" autoCorrect="off" aria-invalid={Boolean(error)} aria-describedby="slug-help"/></label><p id="slug-help">{error || "Lowercase letters, numbers and hyphens. Saving reserves the address; it does not publish a website."}</p>
    <div className="wf-addresses"><strong>Customer Preview URL</strong><code>{error?'Enter a valid slug':urls.primary}</code><small>Production URL · NOT PUBLISHED</small><code>{error?'Enter a valid slug':urls.fallback}</code></div>
    {locked&&<p className="wf-status">Existing website/preview detected. Its route cannot be renamed here; confirm its current slug or request a separate route migration.</p>}
    <div className="wf-buttons"><button className="wf-button" disabled={pending || Boolean(error)}>Save Slug</button><button type="button" className="wf-button secondary" disabled={pending || Boolean(error)} onClick={()=>run('check')}>Check Slug Availability</button><button type="button" className="wf-button secondary" disabled={pending} onClick={()=>{setValue(suggested);setMessage('Suggestion loaded. Check availability and save to confirm.');}}>Use Suggested Slug</button><Link className="wf-button secondary" href={`/admin/ai?requestId=${requestId}&action=slug`}>Regenerate Slug with AI</Link></div>
    <button type="button" className="wf-button secondary" disabled={pending || !saved || value!==saved || Boolean(error)} onClick={()=>{router.refresh();setMessage('Build prompt refreshed from the saved request slug. Unsaved text is never used.');}}>Update Build Prompt</button>
    <p>Save Slug updates the request, build prompt, AI context and action log together. Update Build Prompt reloads the saved version; save any edits first.</p>
    {message&&<p role="status" className="wf-status">{message}</p>}</form></section>;
}
