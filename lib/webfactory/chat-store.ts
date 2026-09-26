import "server-only";
import type { Pool } from "pg";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { database,digest,isAdmin } from "./server";
import { getCustomerSite } from "@/lib/customers/registry";
import { requestSlug } from "./brief-schema";
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
  if(requestId){
    const r=await runner.query("SELECT business,industry,website,details FROM webfactory.requests WHERE id=$1",[requestId]);
    if(!r.rows[0])throw new Error("Request unavailable");
    const brief=await runner.query("SELECT b.brief FROM webfactory.build_workflows w JOIN webfactory.ai_briefs b ON b.id=w.active_brief_id WHERE w.request_id=$1",[requestId]);
    title=r.rows[0].business;
    customerSlug=brief.rows[0]?.brief?.customerSlug || requestSlug(title,requestId);
    context=JSON.stringify({unverifiedCustomerRequest:r.rows[0],draftBrief:brief.rows[0]?.brief || null});
  }else if(slug){
    const site=getCustomerSite(slug);if(!site)throw new Error("Customer unavailable");
    title=site.business.name;
    context=JSON.stringify({customerSlug:slug,existingPreviewBusiness:title,notice:"Other business facts not loaded. Ask admin for verified details."});
  }
  return {title:redactChatText(title,chatSecrets()),context:redactChatText(context,chatSecrets()).slice(0,24000),customerSlug};
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
export async function sendChatTurn(session:string,input:{conversationId:string;turnId:string;requestId?:string;customerSlug?:string;message:string}) {
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
    await client.query("INSERT INTO webfactory.ai_messages(id,conversation_id,turn_id,role,status,model,created_at) VALUES($1,$2,$3,'assistant','pending',$4,NOW()+INTERVAL '1 millisecond')",[assistantId,input.conversationId,input.turnId,process.env.WEBFACTORY_AI_MODEL||"gpt-4.1-mini"]);
    await client.query("COMMIT");
  }catch(error){await client.query("ROLLBACK");throw error;}finally{client.release();}
  try{
    const messages=(await db.query<ChatMessage>("SELECT id,role,content,status FROM webfactory.ai_messages WHERE conversation_id=$1 AND status='complete' ORDER BY created_at DESC,id DESC LIMIT 16",[input.conversationId])).rows.reverse();
    const result=await askWorkspaceAI(context,messages.map(m=>({role:m.role,content:m.content.slice(0,6000)})));
    await db.query("UPDATE webfactory.ai_messages SET status='complete',content=$2,token_usage=$3 WHERE id=$1 AND status='pending'",[assistantId,result.content,JSON.stringify(result.usage)]);
    return {duplicate:false};
  }catch{
    await db.query("UPDATE webfactory.ai_messages SET status='failed',failure_code='generation_failed' WHERE id=$1 AND status='pending'",[assistantId]).catch(()=>{});
    throw new Error("AI response failed. Your message was saved. Refresh and try again manually.");
  }
}
