"use client";
import { useState,useRef } from "react";
import type { ChatMessage } from "@/lib/webfactory/chat-store";
import { reviewActions,reviewPrompt } from "@/lib/webfactory/review-actions";
const quickActions=["Improve Brief","Generate Codex Build Prompt","Write Customer Email","Write SMS","Generate Myndy Context","Create Missing Info Checklist","Create QA Checklist"];
export function AIChat({conversationId,requestId,customerSlug,initialMessages,available,improve,action}:{conversationId:string;requestId?:string;customerSlug?:string;initialMessages:ChatMessage[];available:boolean;improve:boolean;action?:string}){
  const [messages,setMessages]=useState(initialMessages),[text,setText]=useState(reviewPrompt(action || "") || (improve?"Improve the selected draft brief. Identify unsupported claims and missing information.":"")),[pending,setPending]=useState(false),[error,setError]=useState(""),[confirmed,setConfirmed]=useState(false);
  const [saving,setSaving]=useState(false),[artifactKind,setArtifactKind]=useState("change_request");
  const [intent,setIntent]=useState(action || '');
  async function adopt(messageId:string){
    if(!requestId || saving || !window.confirm("Save this draft to the selected request's review history for all authorized admins? This does not approve changes or overwrite the brief."))return;
    setSaving(true);
    try{const response=await fetch("/api/admin/reviews",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:crypto.randomUUID(),requestId,kind:artifactKind,status:"draft",sourceMessageId:messageId,confirmed:true})});const result=await response.json() as {error?:string};if(!response.ok)throw new Error(result.error);setError("Draft saved to request review history. Admin approval and manual build are still required.");}catch(e){setError(e instanceof Error?e.message:"Save unavailable.");}finally{setSaving(false);}
  }
  const sending=useRef(false),turnId=useRef<string|null>(null);
  async function send(){
    if(sending.current||!text.trim()||!confirmed||!available)return;
    sending.current=true;setPending(true);setError("");turnId.current??=crypto.randomUUID();
    window.history.replaceState(null,"","/admin/ai?conversationId="+conversationId);
    try{
      const r=await fetch("/api/admin/ai/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({conversationId,turnId:turnId.current,requestId,customerSlug,message:text,intent,confirmed})});
      const result=await r.json() as {messages?:ChatMessage[];error?:string};
      if(!r.ok||!result.messages)throw new Error(result.error||"Chat unavailable.");
      setMessages(result.messages);setText("");turnId.current=null;
    }catch(e){setError(e instanceof Error?e.message:"Connection interrupted. Refresh to check saved history.");}
    finally{sending.current=false;setPending(false);}
  }
  async function copy(content:string){try{await navigator.clipboard.writeText(content);setError("Answer copied.");}catch{setError("Clipboard unavailable. Select the answer text and copy it manually.");}}
  return <section className="wf-panel wf-chat-main" aria-label="Admin AI chat">
    <h2>Review. Refine. Build with confidence.</h2><p>Draft answers only. This assistant cannot modify briefs, files, integrations or deployment. URL references are not visual inspections; provide your observations. QA plans are not executed test results.</p>
    <div className="wf-chat-actions" aria-label="Preview review actions">{reviewActions.map(([id,label])=><button className="wf-button secondary" type="button" key={id} disabled={pending} onClick={()=>{setIntent(id);setText(reviewPrompt(id));turnId.current=null;setArtifactKind(id==="qa"?"qa_checklist":id==="approval"?"approval_checklist":id==="rebuild"?"rebuild_prompt":"change_request");}}>{label}</button>)}</div>
    {requestId&&<label className="wf-field">Save answers as<select value={artifactKind} onChange={e=>setArtifactKind(e.target.value)}><option value="change_request">Change request</option><option value="rebuild_prompt">Rebuild prompt</option><option value="qa_checklist">QA checklist</option><option value="approval_checklist">Approval checklist</option></select></label>}
    <div className="wf-chat-actions">{quickActions.map(label=><button className="wf-button secondary" type="button" key={label} disabled={pending} onClick={()=>{setIntent("");setText(label+". Use only this context and mark missing information. Return an unsent draft for review.");turnId.current=null;}}>{label}</button>)}</div>
    <div className="wf-chat-history" role="log" aria-label="Saved conversation" aria-live="polite">
      {!messages.length&&<p>No messages yet. Choose an action or ask a question below. Nothing is sent until you press Send.</p>}
      {messages.map(m=><article className={"wf-chat-message "+m.role} key={m.id}><strong>{m.role==="user"?"You":"RS WebFactory AI"}{m.status!=="complete"?" · "+m.status:""}</strong>
        <div style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{m.content|| (m.status==="pending"?"Response pending. Refresh shortly.":"Response unavailable. Send a new message to retry.")}</div>
        {m.role==="assistant"&&m.content&&<div className="wf-chat-actions"><button className="wf-button secondary" type="button" onClick={()=>copy(m.content)}>Copy answer</button><button className="wf-button secondary" type="button" onClick={()=>copy(m.content)}>Copy rebuild prompt for Codex</button>{requestId&&m.status==="complete"&&<button className="wf-button" type="button" disabled={saving} onClick={()=>adopt(m.id)}>{artifactKind==="change_request"?"Use as change request":"Save draft to review history"}</button>}</div>}
      </article>)}
    </div>
    <form className="wf-form" onSubmit={e=>{e.preventDefault();void send();}}>
      {!available&&<p className="wf-status">AI generation unavailable</p>}
      <label className="wf-field">Ask the admin assistant<textarea rows={5} maxLength={4000} value={text} disabled={pending} onChange={e=>{setText(e.target.value);turnId.current=null;}} required/></label>
      <label className="wf-check"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/><span>I authorize sending this chat and selected business context to OpenAI. I have excluded sensitive personal information and credentials.</span></label>
      <button className="wf-button" disabled={!available||pending||!confirmed||!text.trim()}>{pending?"Preparing your draft...":"Send"}</button>
      {pending&&<p role="status">Generating and saving your answer. This can take up to a minute.</p>}
      {error&&<p className="wf-status" role="status">{error}</p>}
    </form>
  </section>;
}
