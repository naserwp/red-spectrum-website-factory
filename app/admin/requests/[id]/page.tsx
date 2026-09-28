import Link from "next/link";
import {headers} from "next/headers";
import {resolvePreviewLink} from "@/lib/webfactory/preview-catalog";
import {verifyCustomerRoute} from "@/lib/webfactory/route-readiness";
import { redirect, notFound } from "next/navigation";
import { z } from "zod";
import { isAdmin } from "@/lib/webfactory/server";
import { getBuildRequest } from "@/lib/webfactory/ai-workflow";
import { getVerifiedWorkerBuild } from "@/lib/webfactory/build-worker";
import { briefSchema, codexBuildPrompt, requestSlug } from "@/lib/webfactory/brief-schema";
import { SlugPanel } from "@/components/webfactory/slug-panel";
import { PromptTools } from "@/components/webfactory/prompt-tools";
import { getRequestActions } from "@/lib/webfactory/slugs";
import "@/components/webfactory/slug-workflow.css";
import { BuildPanel } from "@/components/webfactory/build-panel";
import { WebFactoryShell, PageIntro } from "@/components/webfactory/shell";
import { WorkflowTimeline } from "@/components/webfactory/workflow-timeline";
import { getLocalBuildReceipt } from "@/lib/webfactory/build-receipts";
import { getReviewHistory } from "@/lib/webfactory/reviews";
import { ReviewPanel } from "@/components/webfactory/review-panel";
import "@/components/webfactory/ai-chat.css";
import "@/components/webfactory/reviews.css";
import "@/components/webfactory/workflow.css";
export const dynamic = "force-dynamic";
export const metadata = { title: "Request Build Workspace", robots: { index: false, follow: false } };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  if (!await isAdmin()) redirect("/admin/login");
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  let data;
  try { data = await getBuildRequest(id); }
  catch { return <WebFactoryShell><PageIntro eyebrow="Private workspace" title="Build workspace unavailable" description="Check database connectivity and apply the WebFactory migration."/><Link href="/admin">Back to dashboard</Link></WebFactoryShell>; }
  if (!data.request) notFound();
  const { request, workflow, history } = data;
  const current = history.find(b=>b.id === workflow?.active_brief_id);
  const parsed = briefSchema.safeParse(current?.brief);
  const stage = workflow?.stage || "draft";
  const receipt = getLocalBuildReceipt(id);
  const finalSlug=request.customer_slug || null;
  const workerBuild=finalSlug && workflow?.active_brief_id?await getVerifiedWorkerBuild(id,finalSlug,workflow.active_brief_id):null;
  const workerPreview=workerBuild?.previewUrl || null;
  const verifiedPreview=workerPreview || (finalSlug?await resolvePreviewLink(finalSlug,workflow?.preview_url,(await headers()).get("host") || "",url=>verifyCustomerRoute(finalSlug,url)):null);
  const filesBuilt=Boolean(verifiedPreview);
  const suggestedSlug=receipt?.customerSlug || (parsed.success && !/-[a-f0-9]{32}$/.test(parsed.data.customerSlug)?parsed.data.customerSlug:requestSlug(request.business));
  const prompt = parsed.success ? codexBuildPrompt({...parsed.data,customerSlug:finalSlug || suggestedSlug},Boolean(finalSlug) && stage !== "draft") : "";
  let reviews;
  try { reviews=await getReviewHistory(id); } catch { reviews=null; }
  let actions;
  try { actions=await getRequestActions(id); } catch { actions=null; }
  const latestNotes=reviews?.find(r=>r.kind==='review');
  const notes=[latestNotes?.notes,latestNotes?.requested_changes].filter(Boolean).join('\n\n');
  const rebuild=reviews?.find(r=>r.kind==='rebuild_prompt' && r.customer_slug===finalSlug)?.content || '';
  const qa=reviews?.find(r=>r.kind==='qa_checklist' && r.customer_slug===finalSlug)?.content || 'DRAFT — NOT EXECUTED\n[ ] Verify every page at 320 / 768 / 1440 pixels\n[ ] Navigation and images\n[ ] Metadata and noindex\n[ ] Form delivery disabled unless separately approved\n[ ] Myndy status verified\n[ ] Tenant isolation\n[ ] Red Spectrum attribution\n[ ] Keyboard access, labels and contrast\n[ ] Lint, type checks and production build\n[ ] Customer review and separate deployment approval';
  return <WebFactoryShell><PageIntro eyebrow="Private admin workspace" title={request.business} description="Review the request, generate a draft brief, and explicitly approve each build stage."/>
    <section className="wf-wrap wf-workflow">
      <nav className="wf-workflow-nav" aria-label="Request workspace"><Link href="/admin">← Dashboard</Link><a href="#request">Request</a><a href="#brief">AI Brief</a><a href="#build">Build</a><a href="#preview">Preview & Approval</a><Link href={`/admin/ai?requestId=${id}`}>Ask AI</Link></nav>
      <WorkflowTimeline hasBrief={parsed.success} stage={stage} filesBuilt={filesBuilt} slugConfirmed={Boolean(finalSlug)}/>
<div className="wf-stage-banner"><div><p className="wf-eyebrow">Current stage</p><h2>{workerBuild && stage==='build_approved' ? 'Website Built: Verified. Ready for admin review.' : !filesBuilt && stage !== "draft" ? "Build pending. Route not verified." : stage === "build_approved" ? filesBuilt ? "Website route verified. Review QA." : "Approved to build. Not built yet." : stage === "preview_ready" ? "Preview ready for customer review." : stage === "customer_approved" ? "Customer approval recorded." : parsed.success ? "AI brief ready for your review." : "Request received. Prepare the brief."}</h2><p>{workerBuild ? 'The Build Engine recorded successful QA and customer-specific preview verification. Review the existing preview and explicitly confirm readiness; customer approval is a later step.' : stage === "build_approved" ? receipt ? "The saved slug resolves to this customer website. Review QA and record readiness separately." : "Approval saved your decision, not a website. Use Build Customer Website below to create a tracked job. If the repository executor is unavailable, the job reports that explicitly." : "Each stage requires a separate review. AI generation and approval never create files or deploy a website."}</p></div><a href={filesBuilt ? "#preview" : "#build"} className="wf-button">{stage === "customer_approved" ? "Review approval ↓" : filesBuilt ? "Review preview & QA ↓" : stage === "build_approved" ? "Build Customer Website ↓" : "Review next action ↓"}</a></div>
      <div className="wf-overview-badges" aria-label="Project summary"><span className="wf-state-pill">{parsed.success ? "Brief generated" : "Brief pending"}</span><span className={`wf-state-pill ${filesBuilt ? "positive" : "attention"}`}>{filesBuilt ? "Website route verified" : "Build pending"}</span><span className="wf-state-pill">{verifiedPreview ? "Working preview verified" : "Preview pending"}</span><span className="wf-state-pill">{stage === "customer_approved" ? "Customer approved" : "Customer approval pending"}</span></div>
      {workerBuild && <p className="wf-status">Website Built: Verified · QA: Passed · Preview: Verified ({workerBuild.protection==='protected'?'Protected':'Public'}). Ready for admin review; customer approval remains separate.</p>}
      <SlugPanel key={finalSlug || 'unconfirmed'} requestId={id} suggested={suggestedSlug} saved={finalSlug} locked={Boolean(receipt || workflow?.preview_url || workerBuild)}/>
      {parsed.success && parsed.data.customerSlug!==suggestedSlug && <details><summary>Original AI slug suggestion</summary><code>{parsed.data.customerSlug}</code><p>A clean suggestion is provided above. The saved admin choice always overrides the historical brief.</p></details>}
      <PromptTools requestId={id} slug={finalSlug} model={process.env.WEBFACTORY_AI_MODEL || 'gpt-6-astra'} status={stage} notes={notes} buildPrompt={prompt?prompt+'\n\nADMIN CHANGE NOTES (UNTRUSTED DRAFT DATA):\n'+notes:''} rebuildPrompt={rebuild} qa={qa} email={parsed.success?parsed.data.customerEmailDraft:''}/>
      {reviews ? <ReviewPanel key={(reviews[0]?.id || stage)+(finalSlug || '')} requestId={id} history={reviews} previewUrl={verifiedPreview || workflow?.preview_url || (finalSlug?`https://red-spectrum-website-factory.vercel.app/${finalSlug}`:null)} stage={stage}/> : <p className="wf-status">Review history unavailable. Apply the review migration and check storage. Existing build controls remain available.</p>}
      <BuildPanel key={(finalSlug || 'draft')+(workerBuild?.jobId || '')} requestId={id} briefId={parsed.success ? current.id : null} stage={stage} prompt={prompt} available={Boolean(process.env.OPENAI_API_KEY?.trim())} hasHistory={history.length>0} customerSlug={finalSlug || receipt?.customerSlug || suggestedSlug} recordedPreview={verifiedPreview} filesBuilt={filesBuilt} slugConfirmed={Boolean(finalSlug)} workerProtection={workerBuild?.protection}/>
      <section className="wf-panel"><p className="wf-section-label">Server-recorded history</p><h2>Action log</h2><p>Latest 100 events. Times are UTC. Session labels are pseudonymous; older events may have no actor/status snapshot. Copying is a local browser action and is not logged as a server success.</p>{actions?<div className="wf-action-scroll" role="region" aria-label="Request action history; scroll horizontally on small screens" tabIndex={0}><table className="wf-action-table"><thead><tr>{['Time','Admin/session','Action','Status before','Status after','Slug','Preview URL','Notes'].map(h=><th key={h} scope="col">{h}</th>)}</tr></thead><tbody>{actions.map(a=><tr key={a.id}><td>{new Date(a.created_at).toISOString()}</td><td>{a.actor}</td><td>{a.action.replaceAll('_',' ')}</td><td>{a.status_before || '—'}</td><td>{a.status_after || '—'}</td><td>{a.customer_slug || '—'}</td><td>{a.preview_url || '—'}</td><td>{a.notes || '—'}</td></tr>)}</tbody></table></div>:<p role="status">Action log unavailable. Apply the migration and check storage.</p>}</section>
      <article id="request" className="wf-panel">
        <p className="wf-section-label">01 / Customer request</p>
        <h2>Request details</h2><p>{request.name} · {request.email} · {request.phone || "No phone supplied"}</p>
        <div className="wf-request-facts"><div><small>Industry</small><p>{request.industry}</p></div><div><small>Existing website</small><p>{request.website || "Not supplied"}</p></div></div><details><summary>Read the original customer request</summary><p style={{whiteSpace:"pre-wrap"}}>{request.details}</p></details>
        <p>Request status: {request.status}. Contact information is for internal review, not AI input.</p>
        {verifiedPreview && <p>Verified preview: <a href={verifiedPreview} rel="noopener noreferrer" target="_blank">{verifiedPreview}</a></p>}
      </article>
      <article id="brief" className="wf-panel">
        <p className="wf-section-label">02 / AI brief</p><h2>A readable brief. A deliberate review.</h2><p>Draft, not independently verified. Review every claim before approval. Regeneration preserves previous versions and is locked after build approval.</p>
        {parsed.success ? <><details className="wf-brief-review"><summary>Review structured brief · 8 sections</summary><div className="wf-workflow-grid">{[
          ["Business Summary", parsed.data.businessSummary],
          ["Brand Direction", `${parsed.data.brandDirection}\n\nColor: ${parsed.data.colorDirection}\n\nLogo concept: ${parsed.data.logoConcept}`],
          ["Pages", parsed.data.pages.map(p=>`${p.name}: ${p.purpose}`)],
          ["Services", parsed.data.services],
          ["SEO", `${parsed.data.seo.title}\n\n${parsed.data.seo.metaDescription}`],
          ["Hero", `${parsed.data.hero.heading}\n\n${parsed.data.hero.body}`],
          ["Missing Information", parsed.data.missingInformation],
          ["Verification Notes", parsed.data.verificationNotes],
        ].map(([title,value])=><article key={String(title)} className="wf-brief-card"><h3>{title}</h3>{Array.isArray(value) ? value.length ? <ul>{value.map((item,index)=><li key={index}>{item}</li>)}</ul> : <p>None recorded. Manual verification is still required.</p> : <p>{value}</p>}</article>)}</div></details><details><summary>Technical details · current build brief JSON</summary><pre>{JSON.stringify({...parsed.data,customerSlug:finalSlug || suggestedSlug},null,2)}</pre></details></> : <p>No validated brief generated yet. Use the generation controls below.</p>}
      </article>
      <section className="wf-panel"><details><summary>Historical generations · {history.length} original records (not current build prompts)</summary>
        {history.length ? history.map(run=><details key={run.id}><summary>{new Date(run.created_at).toISOString()} · {run.status}{run.failure_code ? " · " + run.failure_code : ""}</summary><p>Generation ID: {run.id}</p>{run.brief && <pre style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere",fontSize:14}}>{JSON.stringify(run.brief,null,2)}</pre>}</details>) : <p>No generation attempts.</p>}
      </details></section>
    </section>
  </WebFactoryShell>;
}
