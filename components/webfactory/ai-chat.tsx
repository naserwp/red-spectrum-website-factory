"use client";
import { useState,useRef } from "react";
import type { ChatMessage } from "@/lib/webfactory/chat-store";
const quickActions=["Improve Brief","Generate Codex Build Prompt","Write Customer Email","Write SMS","Generate Myndy Context","Create Missing Info Checklist","Create QA Checklist"];
export function AIChat({conversationId,requestId,customerSlug,initialMessages,available,improve}:{conversationId:string;requestId?:string;customerSlug?:string;initialMessages:ChatMessage[];available:boolean;improve:boolean}){
  const [messages,setMessages]=useState(initialMessages),[text,setText]=useState(improve?"Improve the selected draft brief. Identify unsupported claims and missing information.":""),[pending,setPending]=useState(false),[error,setError]=useState(""),[confirmed,setConfirmed]=useState(false);
  const sending=useRef(false),turnId=useRef<string|null>(null);
  async function send(){
    if(sending.current||!text.trim()||!confirmed||!available)return;
    sending.current=true;setPending(true);setError("");turnId.current??=crypto.randomUUID();
    window.history.replaceState(null,"","/admin/ai?conversationId="+conversationId);
    try{
      const r=await fetch("/api/admin/ai/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({conversationId,turnId:turnId.current,requestId,customerSlug,message:text,confirmed})});
      const result=await r.json() as {messages?:ChatMessage[];error?:string};
      if(!r.ok||!result.messages)throw new Error(result.error||"Chat unavailable.");
      setMessages(result.messages);setText("");turnId.current=null;
    }catch(e){setError(e instanceof Error?e.message:"Connection interrupted. Refresh to check saved history.");}
    finally{sending.current=false;setPending(false);}
  }
  async function copy(content:string){try{await navigator.clipboard.writeText(content);setError("Answer copied.");}catch{setError("Clipboard unavailable. Select the answer text and copy it manually.");}}
  return <section className="wf-panel wf-chat-main" aria-label="Admin AI chat">
    <h2>Build materials, together</h2><p>Draft answers only. This assistant cannot modify briefs, files, integrations or deployment.</p>
    <div className="wf-chat-actions">{quickActions.map(label=><button className="wf-button secondary" type="button" key={label} disabled={pending} onClick={()=>{setText(label+". Use only this context and mark missing information. Return an unsent draft for review.");turnId.current=null;}}>{label}</button>)}</div>
    <div className="wf-chat-history" role="log" aria-label="Saved conversation" aria-live="polite">
      {!messages.length&&<p>No messages yet. Choose an action or ask a question below. Nothing is sent until you press Send.</p>}
      {messages.map(m=><article className={"wf-chat-message "+m.role} key={m.id}><strong>{m.role==="user"?"You":"RS WebFactory AI"}{m.status!=="complete"?" · "+m.status:""}</strong>
        <div style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{m.content|| (m.status==="pending"?"Response pending. Refresh shortly.":"Response unavailable. Send a new message to retry.")}</div>
        {m.role==="assistant"&&m.content&&<button className="wf-button secondary" type="button" onClick={()=>copy(m.content)}>Copy answer</button>}
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
