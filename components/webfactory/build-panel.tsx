"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BuildConsole } from "./build-console";

export function BuildPanel({ requestId, briefId, stage, prompt, available, hasHistory, customerSlug, recordedPreview, liveReviewUrl, stagingPreviewPath, filesBuilt = false, slugConfirmed = false, workerProtection, workerConfigured = false }: {
  requestId: string; briefId: string | null; stage: string; prompt: string; available: boolean; hasHistory: boolean; customerSlug?: string; recordedPreview?: string | null; liveReviewUrl?: string | null; stagingPreviewPath?: string | null; filesBuilt?: boolean; slugConfirmed?: boolean; workerProtection?: 'protected'|'public'; workerConfigured?: boolean;
}) {
  const router = useRouter();
  const [pending,setPending] = useState(false);
  const [message,setMessage] = useState("");
  const [confirmed,setConfirmed] = useState(false);
  const [promptVisible,setPromptVisible] = useState(false);
  const [previewUrl] = useState(liveReviewUrl || (recordedPreview?.startsWith("https://")?recordedPreview:null) || (slugConfirmed && customerSlug ? `https://preview.redspectrum.ai/${customerSlug}` : ""));
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
    catch { setPromptVisible(true); setMessage("Clipboard unavailable. Select and copy the displayed prompt."); }
  }
  function download() {
    const url=URL.createObjectURL(new Blob([prompt],{type:"text/plain;charset=utf-8"}));
    const link=document.createElement("a");link.href=url;link.download=`${customerSlug || "customer"}-build-prompt.txt`;link.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    setMessage("Build prompt downloaded. No build or approval was recorded.");
  }
  const approved = ["build_approved", "preview_ready", "customer_approved"].includes(stage);
  const previewReady = filesBuilt && ["preview_ready", "customer_approved"].includes(stage);
  return <section id="build" className="wf-panel wf-form wf-build-handoff" aria-label="AI build workflow">
    <div><p className="wf-section-label">03 / Build handoff</p><h2>{filesBuilt || previewReady ? "Website build & review" : "Build Customer Website"}</h2>
    <p>{previewReady ? "A preview has been recorded by an admin. Customer approval and deployment remain separate steps." : filesBuilt ? "The customer route is verified. Review the site and QA results; deployment remains a separate authorized action." : approved ? "Website not built yet. Start a tracked build below. Repository execution requires a configured build executor." : "Review and approve the AI brief first. Approval authorizes a build; it does not create website files."}</p></div>
    {!filesBuilt && !previewReady && !approved && <p className="wf-status">Website not built yet. Copy the build prompt and run Codex to create this customer website. Approve the brief before running the build.</p>}
    <dl><dt>Build status</dt><dd>{previewReady ? "Website route verified · preview recorded" : filesBuilt ? "Website route and customer identity verified" : approved ? "Build pending" : "Awaiting brief approval"}</dd><dt>Suggested slug</dt><dd>{customerSlug || "Available after brief generation"}</dd><dt>Customer Preview</dt><dd>{previewUrl || "Not assigned yet"}</dd></dl>
    {filesBuilt && recordedPreview && <a className="wf-button secondary" href={recordedPreview} target="_blank" rel="noreferrer">Open Preview ↗</a>}
    <p className="wf-checklist-note">The intended URL is not a published website. Confirm slug availability before building. The route and customer identity are verified server-side. QA and customer approval still require manual review.</p>
    <details><summary>AI generation and approval controls</summary><p>Generate sends the business name, industry, website and description to OpenAI. Direct contact fields are excluded. AI output remains an unverified draft. Generation is locked after build approval.</p>
    {!available && <p className="wf-status">AI generation unavailable</p>}
    <div style={{display:"flex",flexWrap:"wrap",gap:12}}>
      <button className="wf-button" disabled={pending || !confirmed || !available || stage !== "draft"} onClick={()=>run("generate")}>{pending ? "Working..." : hasHistory ? "Regenerate AI Website Brief" : "Generate AI Website Brief"}</button>
      <button className="wf-button secondary" disabled={pending || !confirmed || !briefId || !slugConfirmed || stage !== "draft"} onClick={()=>run("approve")}>Approve for Build</button>
    </div></details>
    <label className="wf-check"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/><span>I reviewed and authorize the selected action. Generation shares business details with OpenAI. Preview readiness requires completed files and QA; customer approval requires actual customer authorization.</span></label>
    <BuildConsole requestId={requestId} enabled={Boolean(briefId && slugConfirmed && ["build_approved","preview_ready"].includes(stage))}/>
    {!workerConfigured && <p className="wf-status" role="status">Controlled Build Engine is not configured for this environment. After slug confirmation and brief approval, use the manual Codex build handoff below. It creates no job, preview, or approval by itself.</p>}
    {prompt && <details open={!workerConfigured && approved}><summary>Manual Codex / OpenCode build handoff</summary><div className="wf-buttons"><button type="button" className="wf-button secondary" disabled={!slugConfirmed || !approved} onClick={()=>setPromptVisible(true)}>Generate Build Prompt</button><button type="button" className="wf-button secondary" disabled={!slugConfirmed || !approved} onClick={copy}>Copy Prompt</button><button type="button" className="wf-button secondary" disabled={!slugConfirmed || !approved} onClick={download}>Download Prompt</button><Link className="wf-button secondary" href={`/admin/ai?requestId=${requestId}&improve=1`}>Generate rebuild prompt / QA checklist</Link></div><p>{approved ? "The handoff is assembled from the saved, approved brief and confirmed slug. Use it in an authorized local coding session; no job, preview or approval is recorded by these buttons." : "Draft for review only. Confirm the slug and approve the brief before using this prompt to build."}</p><details><summary>View required files</summary><ul><li>Customer manifest entry and isolated customer content</li><li>Customer route component and styles</li><li>Logo, favicon, approved images and private delivery records</li><li>Contact form using the existing lead endpoint only after safe activation</li></ul></details><details><summary>View approved brief</summary><p>The complete saved brief is included as JSON at the end of the build prompt.</p><a href="#brief">Review brief and source history ↓</a></details><details><summary>View build requirements</summary><p>Use the confirmed slug, preserve tenant isolation and existing backend controls, and mark unverified claims as draft. Do not deploy, send messages or enable payments.</p></details><details><summary>View QA checklist</summary><ol><li>Check all required pages, navigation, content, branding, images and metadata.</li><li>Test mobile, tablet and desktop layouts, keyboard access and long text.</li><li>Verify lead form inactive or test-only state, rate limiting and tenant isolation.</li><li>Run customer validation, lint, build, and route/preview tests.</li></ol></details>{promptVisible && <label className="wf-field">Build handoff<textarea readOnly value={prompt} rows={14}/></label>}</details>}
    {stagingPreviewPath && <p className="wf-status">Draft files are registered in this deployment. <Link href={stagingPreviewPath} target="_blank">Open staging route ↗</Link> This is not branded preview verification or customer approval.</p>}
    <div id="preview"><p className="wf-section-label">04 / Preview & QA</p><h3>After the website is built</h3></div>
    <ol className="wf-checklist"><li>Create isolated customer files and register the agreed slug.</li><li>Verify every page, facts, links, images, metadata and tenant isolation.</li><li>Check layouts at 320, 768 and 1440 pixels. Run lint and production build.</li><li>Obtain separate deployment approval. After files are created and verified, paste the approved preview URL and mark Preview Ready.</li></ol>
    {workerProtection ? <div className="wf-status" role="status"><strong>Website Built: Verified ✓</strong><p>QA: Passed · Preview: Verified ({workerProtection === 'protected' ? 'Protected' : 'Public'})</p><p>Ready for admin review. The Build Engine already verified the build; no second manual build verification is required. Review the preview, then confirm authorization to enable Mark Preview Ready.</p></div> : <p className="wf-checklist-note">QA checklist: manual review required; no automated pass is claimed here. Customer emails, payments, lookup and automatic deployment remain inactive.</p>}
    {recordedPreview && <a className="wf-button secondary" href={recordedPreview} target="_blank" rel="noopener noreferrer">Open recorded preview ↗</a>}
    <label className="wf-field">Customer preview URL<input type="url" value={previewUrl} readOnly aria-readonly="true" placeholder={customerSlug ? `https://preview.redspectrum.ai/${customerSlug}` : "Confirm Customer Slug above"}/></label>
    <p>The customer-facing preview is the branded canonical URL. Raw Vercel deployment URLs remain in private technical evidence only.</p>
    <div style={{display:"flex",flexWrap:"wrap",gap:12}}>
      {!workerProtection && <button className="wf-button secondary" disabled={pending || !confirmed || stage !== "build_approved" || !slugConfirmed} onClick={()=>run("built")}>Verify Website Built</button>}
      <button className="wf-button secondary" disabled={pending || !confirmed || !slugConfirmed || !briefId || stage !== "build_approved" || !filesBuilt || !previewUrl} onClick={()=>run("preview")}>Mark Preview Ready</button>
      <button className="wf-button secondary" disabled={pending || !confirmed || stage !== "preview_ready" || !filesBuilt} onClick={()=>run("customer")}>Mark Customer Approved</button>
    </div>
    {!confirmed && stage==='build_approved' && filesBuilt && <p role="status">Check “I reviewed and authorize the selected action,” then submit Mark Preview Ready. After it is saved, check the box again to submit Mark Customer Approved. Nothing is approved automatically.</p>}
    {message && <p role="status" aria-live="polite" className="wf-status">{message}</p>}
    <p className="wf-status">Customer approval: <strong>{stage === "customer_approved" ? "Customer Approved" : "Not approved"}</strong>. Marking approval does not send email, take payment or publish the site.</p>
  </section>;
}
