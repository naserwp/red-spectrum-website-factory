import "server-only";
import type { Pool } from "pg";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { database,digest,isAdmin } from "./server";
import { getCustomerSite } from "@/lib/customers/registry";
import { requestSlug,briefSchema,codexBuildPrompt } from "./brief-schema";
import { getLocalBuildReceipt } from "./build-receipts";
import { askWorkspaceAI,chatSecrets } from "./chat-provider";
import { redactChatText } from "./chat-safety";

export type ChatMessage={id:string;role:"user"|"assistant";content:string;status:"pending"|"complete"|"failed"};
export type Conversation={id:string;request_id:string|null;customer_slug:string|null;title:string};
export async function chatSession() {
  if(!await isAdmin())return null;
  const token=(await cookies()).get("wf_admin")?.value;
  return token?digest(token):null;
}
export async function resolveChatContext(requestId?:string|null,slug?:string|null,runner:Pick<Pool,"query">=database()) {
  let title="General website planning",context="No customer selected. Ask for missing business details; do not assume facts.",customerSlug=slug || null;
  let summary:{requestStatus?:string;buildStatus?:string;previewUrl?:string|null;localPath?:string|null;notes?:string;changes?:string;briefSummary?:string;buildPrompt?:string}={};
  if(requestId){
    const r=await runner.query("SELECT business,industry,website,details,status,customer_slug FROM webfactory.requests WHERE id=$1",[requestId]);
    if(!r.rows[0])throw new Error("Request unavailable");
    const brief=await runner.query("SELECT b.brief,w.stage,w.preview_url FROM webfactory.build_workflows w LEFT JOIN webfactory.ai_briefs b ON b.id=w.active_brief_id WHERE w.request_id=$1",[requestId]);
    const reviews=await runner.query("SELECT kind,review_status,preview_url,notes,requested_changes,content,created_at FROM webfactory.request_review_events WHERE request_id=$1 ORDER BY created_at DESC LIMIT 5",[requestId]);
    title=r.rows[0].business;
    const receipt=getLocalBuildReceipt(requestId),parsed=briefSchema.safeParse(brief.rows[0]?.brief);
    customerSlug=r.rows[0].customer_slug || receipt?.customerSlug || requestSlug(title);
    const latestReview=reviews.rows.find(row=>row.kind==="review");
    const currentPrompt=parsed.success?codexBuildPrompt({...parsed.data,customerSlug:customerSlug || parsed.data.customerSlug},Boolean(r.rows[0].customer_slug) && brief.rows[0]?.stage!=="draft"):"";
    summary={requestStatus:r.rows[0].status,buildStatus:receipt?"Local website files created":brief.rows[0]?.stage || "draft",previewUrl:brief.rows[0]?.preview_url || (r.rows[0].customer_slug?`https://preview.redspectrum.ai/${r.rows[0].customer_slug}`:null),localPath:receipt?"/"+customerSlug:null,notes:redactChatText(latestReview?.notes || "",chatSecrets()),changes:redactChatText(latestReview?.requested_changes || "",chatSecrets())};
    summary.briefSummary=redactChatText(parsed.success?parsed.data.businessSummary:"No validated brief yet.",chatSecrets());
    summary.buildPrompt=redactChatText(currentPrompt,chatSecrets());
    context=JSON.stringify({unverifiedCustomerRequest:r.rows[0],customerSlug,buildStatus:receipt?"Local files created; deployment not verified":brief.rows[0]?.stage || "draft",previewUrl:brief.rows[0]?.preview_url || null,intendedPreviewUrl:r.rows[0].customer_slug?`https://preview.redspectrum.ai/${r.rows[0].customer_slug}`:null,localPreviewPath:receipt?"/"+customerSlug:null,latestAdminReviews:reviews.rows,savedSlug:r.rows[0].customer_slug || null,slugConfirmed:Boolean(r.rows[0].customer_slug),draftBrief:parsed.success?{...parsed.data,customerSlug}:null,codexBuildPrompt:currentPrompt || null});
  }else if(slug){
    const site=getCustomerSite(slug);if(!site)throw new Error("Customer unavailable");
    title=site.business.name;
    context=JSON.stringify({customerSlug:slug,existingPreviewBusiness:title,notice:"Other business facts not loaded. Ask admin for verified details."});
  }
  return {title:redactChatText(title,chatSecrets()),context:redactChatText(context,chatSecrets()).slice(0,60000),customerSlug,summary};
}
export async function workspaceData(session:string,conversationId?:string) {
  const db=database();
  const history=await db.query<Conversation>("SELECT id,request_id,customer_slug,title FROM webfactory.ai_conversations WHERE admin_session_hash=$1 ORDER BY created_at DESC LIMIT 30",[session]);
  let conversation:Conversation|undefined,messages:ChatMessage[]=[];
  if(conversationId){
    const c=await db.query<Conversation>("SELECT id,request_id,customer_slug,title FROM webfactory.ai_conversations WHERE id=$1 AND admin_session_hash=$2",[conversationId,session]);
    conversation=c.rows[0];if(!conversation)throw new Error("Conversation unavailable");
    messages=(await db.query<ChatMessage>("SELECT id,role,content,status FROM webfactory.ai_messages WHERE conversation_id=$1 ORDER BY created_at,id LIMIT 100",[conversationId])).rows;
  }
  return {history:history.rows,conversation,messages};
}
export async function sendChatTurn(session:string,input:{conversationId:string;turnId:string;requestId?:string;customerSlug?:string;message:string;intent?:string}) {
  const db=database(),client=await db.connect();
  let context:string,assistantId:string;
  try{
    await client.query("BEGIN");
    // Serialize creation and turns across instances, including duplicate first submissions.
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))",[input.conversationId]);
    const c=await client.query<Conversation & {admin_session_hash:string}>("SELECT * FROM webfactory.ai_conversations WHERE id=$1 FOR UPDATE",[input.conversationId]);
    if(c.rows[0]&&c.rows[0].admin_session_hash!==session)throw new Error("Conversation unavailable");
    const existing=c.rows[0];
    if(existing&&((input.requestId&&input.requestId!==existing.request_id)||(input.customerSlug&&input.customerSlug!==existing.customer_slug)))throw new Error("Context mismatch");
    const resolved=await resolveChatContext(existing?existing.request_id:input.requestId,existing?existing.customer_slug:input.customerSlug,client);
    context=resolved.context;
    if(!existing)await client.query("INSERT INTO webfactory.ai_conversations(id,admin_session_hash,request_id,customer_slug,title) VALUES($1,$2,$3,$4,$5)",[input.conversationId,session,input.requestId||null,resolved.customerSlug,resolved.title]);
    const duplicate=await client.query("SELECT id FROM webfactory.ai_messages WHERE conversation_id=$1 AND turn_id=$2",[input.conversationId,input.turnId]);
    if(duplicate.rowCount){await client.query("COMMIT");return {duplicate:true};}
    await client.query("UPDATE webfactory.ai_messages SET status='failed',failure_code='interrupted' WHERE conversation_id=$1 AND status='pending' AND created_at<NOW()-INTERVAL '3 minutes'",[input.conversationId]);
    const pending=await client.query("SELECT id FROM webfactory.ai_messages WHERE conversation_id=$1 AND status='pending'",[input.conversationId]);
    if(pending.rowCount)throw new Error("A response is already pending. Refresh shortly.");
    const count=await client.query("SELECT count(*)::int AS n FROM webfactory.ai_messages WHERE conversation_id=$1",[input.conversationId]);
    if(count.rows[0].n>=80)throw new Error("Start a new conversation to continue.");
    assistantId=randomUUID();
    await client.query("INSERT INTO webfactory.ai_messages(id,conversation_id,turn_id,role,content,status) VALUES($1,$2,$3,'user',$4,'complete')",[randomUUID(),input.conversationId,input.turnId,redactChatText(input.message,chatSecrets())]);
    await client.query("INSERT INTO webfactory.ai_messages(id,conversation_id,turn_id,role,status,model,created_at) VALUES($1,$2,$3,'assistant','pending',$4,NOW()+INTERVAL '1 millisecond')",[assistantId,input.conversationId,input.turnId,process.env.WEBFACTORY_AI_MODEL||"gpt-6-astra"]);
    await client.query("COMMIT");
  }catch(error){await client.query("ROLLBACK");throw error;}finally{client.release();}
  try{
    const messages=(await db.query<ChatMessage>("SELECT id,role,content,status FROM webfactory.ai_messages WHERE conversation_id=$1 AND status='complete' ORDER BY created_at DESC,id DESC LIMIT 16",[input.conversationId])).rows.reverse();
    const result=await askWorkspaceAI(context,messages.map(m=>({role:m.role,content:m.content.slice(0,6000)})));
    const completed=await db.connect();
    try{
      await completed.query('BEGIN');
      await completed.query("UPDATE webfactory.ai_messages SET status='complete',content=$2,token_usage=$3 WHERE id=$1 AND status='pending'",[assistantId,result.content,JSON.stringify(result.usage)]);
      await completed.query("INSERT INTO webfactory.request_actions(request_id,actor,action,status_before,status_after,customer_slug,preview_url,notes,event_key) SELECT r.id,$2,$3,w.stage,w.stage,r.customer_slug,w.preview_url,'AI draft only; not applied or approved.',$4 FROM webfactory.ai_conversations c JOIN webfactory.requests r ON r.id=c.request_id LEFT JOIN webfactory.build_workflows w ON w.request_id=r.id WHERE c.id=$1 ON CONFLICT(event_key) DO NOTHING",[input.conversationId,'session:'+session.slice(0,12),input.intent==='rebuild'?'rebuild_prompt_generated':input.intent==='slug'?'slug_suggested':'ai_review_generated','chat-answer:'+assistantId]);
      await completed.query('COMMIT');
    }catch(error){await completed.query('ROLLBACK');throw error;}finally{completed.release();}
    return {duplicate:false};
  }catch{
    await db.query("UPDATE webfactory.ai_messages SET status='failed',failure_code='generation_failed' WHERE id=$1 AND status='pending'",[assistantId]).catch(()=>{});
    throw new Error("AI response failed. Your message was saved. Refresh and try again manually.");
  }
}
