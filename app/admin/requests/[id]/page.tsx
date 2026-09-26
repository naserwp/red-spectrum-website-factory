import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { z } from "zod";
import { isAdmin } from "@/lib/webfactory/server";
import { getBuildRequest } from "@/lib/webfactory/ai-workflow";
import { briefSchema, codexBuildPrompt } from "@/lib/webfactory/brief-schema";
import { BuildPanel } from "@/components/webfactory/build-panel";
import { WebFactoryShell, PageIntro } from "@/components/webfactory/shell";
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
  const prompt = parsed.success ? codexBuildPrompt(parsed.data,stage !== "draft") : "";
  return <WebFactoryShell><PageIntro eyebrow="Private admin workspace" title={request.business} description="Review the request, generate a draft brief, and explicitly approve each build stage."/>
    <section className="wf-wrap wf-section" style={{paddingTop:0}}>
      <Link href="/admin">Back to dashboard</Link> · <Link href={`/admin/ai?requestId=${id}`}>Ask AI about this request</Link>
      <article className="wf-panel" style={{margin:"24px 0",overflowWrap:"anywhere"}}>
        <h2>Request details</h2><p>{request.name} · {request.email} · {request.phone || "No phone supplied"}</p>
        <p>{request.industry}</p><p>Website: {request.website || "Not supplied"}</p><p style={{whiteSpace:"pre-wrap"}}>{request.details}</p>
        <p>Request status: {request.status}. Contact information is for internal review, not AI input.</p>
        {workflow?.preview_url && <p>Recorded preview: <a href={workflow.preview_url} rel="noopener noreferrer" target="_blank">{workflow.preview_url}</a></p>}
      </article>
      <BuildPanel requestId={id} briefId={parsed.success ? current.id : null} stage={stage} prompt={prompt} available={Boolean(process.env.OPENAI_API_KEY?.trim())} hasHistory={history.length>0}/>
      <article className="wf-panel" style={{marginTop:24}}>
        <h2>Generated brief preview</h2><p>Draft, not independently verified. Review every claim before approval. Regeneration preserves previous versions and is locked after build approval.</p>
        {parsed.success ? <pre style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere",fontSize:14}}>{JSON.stringify(parsed.data,null,2)}</pre> : <p>No validated brief generated yet.</p>}
      </article>
      <section className="wf-panel" style={{marginTop:24}}><h2>Generation history</h2>
        {history.length ? history.map(run=><details key={run.id}><summary>{new Date(run.created_at).toISOString()} · {run.status}{run.failure_code ? " · " + run.failure_code : ""}</summary><p>Generation ID: {run.id}</p>{run.brief && <pre style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere",fontSize:14}}>{JSON.stringify(run.brief,null,2)}</pre>}</details>) : <p>No generation attempts.</p>}
      </section>
    </section>
  </WebFactoryShell>;
}
