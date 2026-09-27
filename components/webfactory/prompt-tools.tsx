"use client";
import Link from "next/link";
import {useState} from "react";
export function PromptTools({requestId,slug,model,status,notes,buildPrompt,rebuildPrompt,qa,email}:{requestId:string;slug:string|null;model:string;status:string;notes:string;buildPrompt:string;rebuildPrompt:string;qa:string;email:string}){
  const [message,setMessage]=useState('');
  async function copy(value:string,label:string){try{await navigator.clipboard.writeText(value);setMessage(label+' copied locally. Clipboard actions are not server-audited.');}catch{setMessage('Clipboard unavailable. Expand the output and copy manually.');}}
  return <section className="wf-panel wf-prompt-tools"><p className="wf-section-label">Manual build handoff</p><h2>Review the plan. Build deliberately.</h2><p className="wf-status">Next action: {!slug?'Confirm Customer Slug before approving or building.':status==='draft'?'Review the brief and approve the build.':'Review the latest scope; run Codex manually, then complete QA. No automatic build or deployment.'}</p>
    <dl><dt>Final slug</dt><dd>{slug || 'Not confirmed'}</dd><dt>Production / fallback URL</dt><dd>{slug?`https://red-spectrum-website-factory.vercel.app/${slug}`:'Confirm slug first'}</dd><dt>Preview domain (verify before use)</dt><dd>{slug?`https://preview.redspectrum.ai/${slug}`:"Confirm slug first"}</dd><dt>Build stage</dt><dd>{status.replaceAll('_',' ')}</dd><dt>Selected AI model</dt><dd>{model}</dd></dl>
    <details><summary>Admin change notes</summary><p style={{whiteSpace:'pre-wrap'}}>{notes || 'No changes recorded.'}</p></details>
    <div className="wf-buttons"><button className="wf-button" disabled={!slug || !buildPrompt} onClick={()=>copy(buildPrompt,'Build prompt')}>Copy Codex Build Prompt</button><Link className="wf-button secondary" href={`/admin/ai?requestId=${requestId}&action=design`}>Ask AI for changes</Link><Link className="wf-button secondary" href={`/admin/ai?requestId=${requestId}&action=rebuild`}>Generate rebuild prompt</Link></div>
    <p>Draft output only. Copying does not authorize edits. Saved rebuild output may reference an older slug: regenerate after changing the address.</p>
    <div className="wf-buttons">{[['Rebuild Prompt',rebuildPrompt],['QA Checklist',qa],['Customer Email Draft',email]].map(([label,value])=><button key={label} className="wf-button secondary" disabled={!value || !slug} onClick={()=>copy(value,label)}>Copy {label}</button>)}</div>
    {[['Build Prompt',buildPrompt],['Rebuild Prompt',rebuildPrompt],['QA Checklist',qa],['Customer Email Draft',email]].map(([label,value])=>value&&<details key={label}><summary>{label} · draft</summary><pre>{value}</pre></details>)}
    {message&&<p role="status">{message}</p>}
  </section>;
}
