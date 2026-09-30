import "server-only";
import { randomUUID } from "node:crypto";
import { database, type ProjectRequest } from "./server";
import { generateStructuredBrief } from "./ai-provider";
import { briefSchema, requestSlug } from "./brief-schema";
import { verifyCustomerRoute } from "./route-readiness";
import { localCustomerUrl } from "./route-readiness";
import { headers } from "next/headers";
import { previewUrls } from "./slug-rules";
import { getVerifiedWorkerBuild, getVerifiedWorkerPreview } from "./build-worker";
import { canonicalBrandedPreview, isCustomerFacingPreview } from "./workflow-state";

export class WorkflowError extends Error {}
export type BuildState = { stage: string; active_brief_id: string | null; preview_url: string | null };

export async function getBuildRequest(id: string) {
  const db = database();
  const [request, workflow, history] = await Promise.all([
    db.query<ProjectRequest>("SELECT * FROM webfactory.requests WHERE id=$1", [id]),
    db.query<BuildState>("SELECT stage,active_brief_id,preview_url FROM webfactory.build_workflows WHERE request_id=$1", [id]),
    db.query("SELECT id,status,brief,failure_code,created_at FROM webfactory.ai_briefs WHERE request_id=$1 ORDER BY (id=(SELECT active_brief_id FROM webfactory.build_workflows WHERE request_id=$1)) DESC NULLS LAST,created_at DESC LIMIT 10", [id]),
  ]);
  return { request: request.rows[0], workflow: workflow.rows[0], history: history.rows };
}

export async function generateForRequest(id: string, actor="server (unattributed)") {
  if (!process.env.OPENAI_API_KEY?.trim()) throw new WorkflowError("AI generation unavailable");
  const db = database(), client = await db.connect();
  const runId = randomUUID();
  let request: ProjectRequest;
  try {
    await client.query("BEGIN");
    await client.query("SELECT set_config('webfactory.actor',$1,true)",[actor]);
    const r = await client.query<ProjectRequest>("SELECT * FROM webfactory.requests WHERE id=$1 FOR UPDATE", [id]);
    if (!r.rows[0]) throw new WorkflowError("Request not found.");
    request = r.rows[0];
    await client.query("INSERT INTO webfactory.build_workflows(request_id) VALUES($1) ON CONFLICT DO NOTHING", [id]);
    const w = await client.query<BuildState>("SELECT * FROM webfactory.build_workflows WHERE request_id=$1 FOR UPDATE", [id]);
    if (w.rows[0].stage !== "draft") throw new WorkflowError("This brief is approved. Regeneration is locked to preserve the approved build.");
    await client.query("UPDATE webfactory.ai_briefs SET status='failed',failure_code='interrupted',completed_at=NOW() WHERE request_id=$1 AND status='generating' AND created_at < NOW()-INTERVAL '3 minutes'", [id]);
    const running = await client.query("SELECT id FROM webfactory.ai_briefs WHERE request_id=$1 AND status='generating'", [id]);
    if (running.rowCount) throw new WorkflowError("Generation is already running. Refresh shortly.");
    await client.query("INSERT INTO webfactory.ai_briefs(id,request_id,status,model) VALUES($1,$2,'generating',$3)", [runId,id,process.env.WEBFACTORY_AI_MODEL || "gpt-4.1-mini"]);
    await client.query("INSERT INTO webfactory.build_events(request_id,brief_id,event) VALUES($1,$2,'generation_started')", [id,runId]);
    await client.query("COMMIT");
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
  try {
    const brief = await generateStructuredBrief({ business: request.business, industry: request.industry, website: request.website, details: request.details }, request.customer_slug || requestSlug(request.business));
    const saved = await db.connect();
    try {
      await saved.query("BEGIN");
      await saved.query("SELECT set_config('webfactory.actor',$1,true)",[actor]);
      const latest=(await saved.query("SELECT customer_slug FROM webfactory.requests WHERE id=$1 FOR UPDATE", [id])).rows[0];
      if(latest?.customer_slug)brief.customerSlug=latest.customer_slug;
      const completed = await saved.query("UPDATE webfactory.ai_briefs SET status='generated',brief=$2,completed_at=NOW() WHERE id=$1 AND status='generating' RETURNING id", [runId,JSON.stringify(brief)]);
      if (!completed.rowCount) throw new WorkflowError("Generation expired. Please generate again.");
      await saved.query("UPDATE webfactory.build_workflows SET active_brief_id=$2,updated_at=NOW() WHERE request_id=$1 AND stage='draft'", [id,runId]);
      await saved.query("INSERT INTO webfactory.build_events(request_id,brief_id,event) VALUES($1,$2,'generation_completed')", [id,runId]);
      await saved.query("COMMIT");
    } catch (error) { await saved.query("ROLLBACK"); throw error; }
    finally { saved.release(); }
  } catch {
    await db.query("UPDATE webfactory.ai_briefs SET status='failed',failure_code='generation_failed',completed_at=NOW() WHERE id=$1 AND status='generating'", [runId]).catch(() => {});
    throw new WorkflowError("AI generation failed or timed out. No new brief was approved. Refresh and retry manually.");
  }
}

export async function transitionBuild(id: string, action: string, briefId: string, previewUrl?: string, actor="server (unattributed)") {
  const client = await database().connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT set_config('webfactory.actor',$1,true)",[actor]);
    const request=(await client.query("SELECT customer_slug FROM webfactory.requests WHERE id=$1 FOR UPDATE", [id])).rows[0];
    if(!request?.customer_slug)throw new WorkflowError("Save and confirm the Customer Slug before approving this step.");
    const w = await client.query<BuildState>("SELECT * FROM webfactory.build_workflows WHERE request_id=$1 FOR UPDATE", [id]);
    const current = w.rows[0];
    if (!current || current.active_brief_id !== briefId) throw new WorkflowError("The brief changed. Refresh before approving.");
    const running = await client.query("SELECT id FROM webfactory.ai_briefs WHERE request_id=$1 AND status='generating'", [id]);
    if (running.rowCount) throw new WorkflowError("Wait for generation to finish before approving.");
    const b = await client.query("SELECT brief FROM webfactory.ai_briefs WHERE id=$1 AND request_id=$2 AND status='generated'", [briefId,id]);
    if (!b.rows[0] || !briefSchema.safeParse(b.rows[0].brief).success) throw new WorkflowError("A valid generated brief is required.");
    if(action === "built"){
      if(current.stage!=="build_approved")throw new WorkflowError("Approve the build first.");
      // The worker already recorded Website Built after QA and authenticated
      // preview verification. Do not re-probe a production route or log it twice.
      if(await getVerifiedWorkerPreview(id,request.customer_slug,briefId)){await client.query('COMMIT');return;}
      const urls=previewUrls(request.customer_slug);
      const candidates=[localCustomerUrl(request.customer_slug,(await headers()).get('host') || ''),urls.fallback,urls.primary].filter((url):url is string=>Boolean(url));
      let verifiedUrl:string|null=null;
      for(const url of candidates)if(await verifyCustomerRoute(request.customer_slug,url)){verifiedUrl=url;break;}
      if(!verifiedUrl)throw new WorkflowError("Build pending: no working route matches the saved customer slug.");
      await client.query("INSERT INTO webfactory.request_actions(request_id,actor,action,status_before,status_after,customer_slug,preview_url,notes,event_key) VALUES($1,$2,'website_built',$3,$3,$4,$5,'Route and tenant identity verified; not preview or customer approval.',$6) ON CONFLICT(event_key) DO NOTHING",[id,actor,current.stage,request.customer_slug,verifiedUrl,`built:${id}:${briefId}:${request.customer_slug}`]);
      await client.query("COMMIT");return;
    }
    const transitions: Record<string, [string,string,string]> = { approve: ["draft","build_approved","building"], preview: ["build_approved","preview_ready","preview_ready"], customer: ["preview_ready","customer_approved","approved"] };
    const next = transitions[action];
    if (!next || current.stage !== next[0]) throw new WorkflowError("Complete the preceding review step first.");
    const workerBuild=(action==="preview" || action==="customer")?await getVerifiedWorkerBuild(id,request.customer_slug,briefId):null;
    if (action === "preview") {
      if (!previewUrl || previewUrl !== canonicalBrandedPreview(request.customer_slug) || !isCustomerFacingPreview(request.customer_slug,previewUrl)) throw new WorkflowError("Use this customer's exact branded preview URL.");
    }
    if(action === "preview" || action === "customer"){
      const verifiedUrl=action === "preview"?previewUrl:current.preview_url;
      if(!workerBuild || !verifiedUrl || !await verifyCustomerRoute(request.customer_slug,verifiedUrl))throw new WorkflowError("Build pending: verified build evidence and the branded customer preview are both required before readiness or approval.");
      const audit=JSON.stringify({canonicalPreview:verifiedUrl,rawDeployment:{id:workerBuild.jobId,url:workerBuild.previewUrl,reference:workerBuild.deploymentReference},artifact:{commit:workerBuild.artifactCommit,fingerprint:workerBuild.artifactFingerprint},qa:"passed",identity:"canonical URL, business identity, and tenant isolation verified",authorization:"explicit admin confirmation"});
      await client.query("SELECT set_config('webfactory.workflow_notes',$1,true)",[audit]);
    }
    await client.query("UPDATE webfactory.build_workflows SET stage=$2,preview_url=COALESCE($3,preview_url),updated_at=NOW() WHERE request_id=$1", [id,next[1],action === "preview" ? canonicalBrandedPreview(request.customer_slug) : null]);
    await client.query("UPDATE webfactory.requests SET status=$2,updated_at=NOW() WHERE id=$1", [id,next[2]]);
    await client.query("INSERT INTO webfactory.build_events(request_id,brief_id,event) VALUES($1,$2,$3)", [id,briefId,next[1]]);
    if(action==="preview" || action==="customer"){
      await client.query("INSERT INTO webfactory.request_review_events(id,request_id,customer_slug,kind,review_status,preview_url,notes,requested_changes,admin_session_hash) SELECT $1,$2,$3,'review',$4,$5,COALESCE((SELECT notes FROM webfactory.request_review_events WHERE request_id=$2 AND kind='review' ORDER BY created_at DESC LIMIT 1),''),COALESCE((SELECT requested_changes FROM webfactory.request_review_events WHERE request_id=$2 AND kind='review' ORDER BY created_at DESC LIMIT 1),''),'gated-build-action'",[randomUUID(),id,request.customer_slug,action==="customer"?"approved":"preview_ready",canonicalBrandedPreview(request.customer_slug)]);
    }
    await client.query("COMMIT");
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
}
