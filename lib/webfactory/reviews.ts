import "server-only";
import { z } from "zod";
import { database } from "./server";
import { slugFromCanonicalCustomerUrl } from "@/lib/customers/domains";
import { slugFromPreviewUrl } from "./slug-rules";
import { verifyCustomerRoute } from "./route-readiness";
import { redactChatText } from "./chat-safety";
import { chatSecrets } from "./chat-provider";

export const reviewInput = z.object({
  id: z.string().uuid(), requestId: z.string().uuid(),
  kind: z.enum(["review","change_request","rebuild_prompt","qa_checklist","approval_checklist"]),
  status: z.enum(["draft","building","preview_ready","changes_requested","rebuilding","approved"]),
  previewUrl: z.string().max(500).default(""), notes: z.string().max(8000).default(""),
  requestedChanges: z.string().max(8000).default(""), sourceMessageId: z.string().uuid().optional(),
  confirmed: z.literal(true),
}).strict();
export type ReviewEvent = {id:string;customer_slug:string|null;kind:string;review_status:string;preview_url:string;notes:string;requested_changes:string;content:string;created_at:string};
export async function getReviewHistory(requestId:string) {
  return (await database().query<ReviewEvent>("SELECT id,customer_slug,kind,review_status,preview_url,notes,requested_changes,content,created_at FROM webfactory.request_review_events WHERE request_id=$1 ORDER BY created_at DESC,id DESC LIMIT 30",[requestId])).rows;
}
export async function saveReview(session:string,input:z.infer<typeof reviewInput>) {
  const client=await database().connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT set_config('webfactory.actor',$1,true)",["session:"+session.slice(0,12)]);
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))",[input.id]);
    const duplicate=await client.query("SELECT request_id,admin_session_hash FROM webfactory.request_review_events WHERE id=$1",[input.id]);
    if(duplicate.rows[0]){
      if(duplicate.rows[0].request_id!==input.requestId || duplicate.rows[0].admin_session_hash!==session)throw new Error("Review unavailable.");
      await client.query("COMMIT");return;
    }
    const request=await client.query("SELECT id,customer_slug FROM webfactory.requests WHERE id=$1 FOR UPDATE",[input.requestId]);
    if(!request.rowCount)throw new Error("Request unavailable.");
    const workflow=(await client.query("SELECT w.stage,w.preview_url,b.brief FROM webfactory.build_workflows w LEFT JOIN webfactory.ai_briefs b ON b.id=w.active_brief_id WHERE w.request_id=$1",[input.requestId])).rows[0];
    const slug=request.rows[0].customer_slug || null;
    if(input.status==="approved" && workflow?.stage!=="customer_approved")throw new Error("Record customer approval using the gated build controls first.");
    if(input.status==="preview_ready" && !["preview_ready","customer_approved"].includes(workflow?.stage))throw new Error("Complete QA and record preview readiness using the gated build controls first.");
    if(["building","rebuilding","changes_requested"].includes(input.status)&&(!workflow || workflow.stage==="draft"))throw new Error("Approve the build before recording build or change status.");
    if(input.previewUrl){
      const url=new URL(input.previewUrl);
      if(slugFromPreviewUrl(url.href)!==slug && slugFromCanonicalCustomerUrl(url.href)!==slug)throw new Error("Use this customer's exact preview URL or registered canonical website.");
    }
    if(["preview_ready","approved"].includes(input.status) && (!slug || !await verifyCustomerRoute(slug,input.previewUrl || workflow?.preview_url || "")))throw new Error("Build pending: customer route verification is required.");
    let content="";
    if(input.sourceMessageId){
      const message=await client.query("SELECT m.content FROM webfactory.ai_messages m JOIN webfactory.ai_conversations c ON c.id=m.conversation_id WHERE m.id=$1 AND c.request_id=$2 AND c.admin_session_hash=$3 AND m.role='assistant' AND m.status='complete'",[input.sourceMessageId,input.requestId,session]);
      if(!message.rows[0])throw new Error("Answer unavailable in this request and admin session.");
      content=message.rows[0].content;
    }
    const clean=(value:string)=>redactChatText(value,chatSecrets());
    if(input.kind==="review" && ["changes_requested","rebuilding"].includes(input.status)){
      if(!input.requestedChanges.trim())throw new Error("Describe the requested changes first.");
      // Re-open QA/approval without changing the approved brief or running a build.
      await client.query("UPDATE webfactory.build_workflows SET stage='build_approved',updated_at=NOW() WHERE request_id=$1",[input.requestId]);
      await client.query("UPDATE webfactory.requests SET status='building',updated_at=NOW() WHERE id=$1",[input.requestId]);
    }
    await client.query("INSERT INTO webfactory.request_review_events(id,request_id,customer_slug,kind,review_status,preview_url,notes,requested_changes,content,source_message_id,admin_session_hash) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT DO NOTHING",[input.id,input.requestId,slug,input.kind,input.status,input.previewUrl,clean(input.notes),clean(input.requestedChanges),clean(content),input.sourceMessageId||null,session]);
    await client.query("COMMIT");
  } catch(error){await client.query("ROLLBACK");throw error;} finally {client.release();}
}
