"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function BuildPanel({ requestId, briefId, stage, prompt, available, hasHistory }: {
  requestId: string; briefId: string | null; stage: string; prompt: string; available: boolean; hasHistory: boolean;
}) {
  const router = useRouter();
  const [pending,setPending] = useState(false);
  const [message,setMessage] = useState("");
  const [confirmed,setConfirmed] = useState(false);
  const [previewUrl,setPreviewUrl] = useState("");
  async function run(action: string) {
    if (pending || !confirmed) return;
    setPending(true); setMessage("");
    try {
      const response = await fetch("/api/admin/requests/" + requestId + "/build", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, confirmed, ...(briefId ? { briefId } : {}), ...(action === "preview" ? { previewUrl } : {}) }),
      });
      const data = await response.json() as { error?: string };
      setMessage(response.ok ? "Saved. Review the updated workflow below." : data.error || "Action failed.");
      setConfirmed(false); router.refresh();
    } catch { setMessage("Connection interrupted. Refresh to check the saved generation status before retrying."); }
    finally { setPending(false); }
  }
  async function copy() {
    try { await navigator.clipboard.writeText(prompt); setMessage("Codex Build Prompt copied."); }
    catch { setMessage("Clipboard unavailable. Select and copy the prompt from the field below."); }
  }
  return <section className="wf-panel wf-form" aria-label="AI build workflow">
    <h2>AI-assisted build workflow</h2>
    <p>Stage: <strong>{stage.replaceAll("_"," ")}</strong>. No files, emails or deployments are created by these actions.</p>
    <p>Generate sends the selected business name, industry, website and project description to OpenAI. Direct contact fields are excluded; remove sensitive information from the description before submitting a request. AI output is an unverified draft.</p>
    {!available && <p className="wf-status">AI generation unavailable</p>}
    <label className="wf-check"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/><span>I reviewed the request and authorize the selected action. For generation, I authorize sending these business details to OpenAI. For preview/customer approval, I have manually verified the preview or obtained customer approval.</span></label>
    <div style={{display:"flex",flexWrap:"wrap",gap:12}}>
      <button className="wf-button" disabled={pending || !confirmed || !available || stage !== "draft"} onClick={()=>run("generate")}>{pending ? "Working..." : hasHistory ? "Regenerate AI Website Brief" : "Generate AI Website Brief"}</button>
      <button className="wf-button secondary" disabled={pending || !confirmed || !briefId || stage !== "draft"} onClick={()=>run("approve")}>Approve for Build</button>
    </div>
    <label className="wf-field">Customer preview URL<input type="url" value={previewUrl} onChange={e=>setPreviewUrl(e.target.value)} placeholder="https://preview.redspectrum.ai/customer-slug" disabled={stage !== "build_approved"}/></label>
    <div style={{display:"flex",flexWrap:"wrap",gap:12}}>
      <button className="wf-button secondary" disabled={pending || !confirmed || stage !== "build_approved" || !previewUrl} onClick={()=>run("preview")}>Mark Preview Ready</button>
      <button className="wf-button secondary" disabled={pending || !confirmed || stage !== "preview_ready"} onClick={()=>run("customer")}>Mark Customer Approved</button>
    </div>
    {message && <p role="status" aria-live="polite" className="wf-status">{message}</p>}
    {prompt && <><Link href={`/admin/ai?requestId=${requestId}&improve=1`}>Ask AI to improve this brief</Link><h3>Codex Build Prompt</h3><p>{stage === "draft" ? "Draft handoff only. Approve for Build before asking Codex to create files." : "Build authorization only; deployment still requires separate approval."}</p><button type="button" className="wf-button secondary" onClick={copy}>Copy prompt for Codex</button><label className="wf-field">Build handoff<textarea readOnly value={prompt} rows={14}/></label></>}
  </section>;
}
