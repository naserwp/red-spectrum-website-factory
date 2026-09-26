import "server-only";
import { randomUUID } from "node:crypto";
import { database, type ProjectRequest } from "./server";
import { generateStructuredBrief } from "./ai-provider";
import { briefSchema, requestSlug } from "./brief-schema";

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

export async function generateForRequest(id: string) {
  if (!process.env.OPENAI_API_KEY?.trim()) throw new WorkflowError("AI generation unavailable");
  const db = database(), client = await db.connect();
  const runId = randomUUID();
  let request: ProjectRequest;
  try {
    await client.query("BEGIN");
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
    const brief = await generateStructuredBrief({ business: request.business, industry: request.industry, website: request.website, details: request.details }, requestSlug(request.business,id));
    const saved = await db.connect();
    try {
      await saved.query("BEGIN");
      await saved.query("SELECT id FROM webfactory.requests WHERE id=$1 FOR UPDATE", [id]);
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

export async function transitionBuild(id: string, action: string, briefId: string, previewUrl?: string) {
  const client = await database().connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT id FROM webfactory.requests WHERE id=$1 FOR UPDATE", [id]);
    const w = await client.query<BuildState>("SELECT * FROM webfactory.build_workflows WHERE request_id=$1 FOR UPDATE", [id]);
    const current = w.rows[0];
    if (!current || current.active_brief_id !== briefId) throw new WorkflowError("The brief changed. Refresh before approving.");
    const running = await client.query("SELECT id FROM webfactory.ai_briefs WHERE request_id=$1 AND status='generating'", [id]);
    if (running.rowCount) throw new WorkflowError("Wait for generation to finish before approving.");
    const b = await client.query("SELECT brief FROM webfactory.ai_briefs WHERE id=$1 AND request_id=$2 AND status='generated'", [briefId,id]);
    if (!b.rows[0] || !briefSchema.safeParse(b.rows[0].brief).success) throw new WorkflowError("A valid generated brief is required.");
    const transitions: Record<string, [string,string,string]> = { approve: ["draft","build_approved","building"], preview: ["build_approved","preview_ready","preview_ready"], customer: ["preview_ready","customer_approved","approved"] };
    const next = transitions[action];
    if (!next || current.stage !== next[0]) throw new WorkflowError("Complete the preceding review step first.");
    if (action === "preview") {
      const url = new URL(previewUrl || "");
      if (!["preview.redspectrum.ai","red-spectrum-website-factory.vercel.app"].includes(url.hostname) || url.protocol !== "https:" || url.username || url.password || url.search || url.hash || url.pathname !== "/" + b.rows[0].brief.customerSlug) throw new WorkflowError("Enter this customer's exact HTTPS preview URL on the approved preview host.");
    }
    await client.query("UPDATE webfactory.build_workflows SET stage=$2,preview_url=COALESCE($3,preview_url),updated_at=NOW() WHERE request_id=$1", [id,next[1],previewUrl || null]);
    await client.query("UPDATE webfactory.requests SET status=$2,updated_at=NOW() WHERE id=$1", [id,next[2]]);
    await client.query("INSERT INTO webfactory.build_events(request_id,brief_id,event) VALUES($1,$2,$3)", [id,briefId,next[1]]);
    await client.query("COMMIT");
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
}
