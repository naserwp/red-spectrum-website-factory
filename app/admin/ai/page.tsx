import Link from "next/link";
import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { chatSession,workspaceData,resolveChatContext } from "@/lib/webfactory/chat-store";
import { listRequests } from "@/lib/webfactory/server";
import { getCustomerSites } from "@/lib/customers/registry";
import { AIChat } from "@/components/webfactory/ai-chat";
import { WebFactoryShell,PageIntro } from "@/components/webfactory/shell";
import "@/components/webfactory/ai-chat.css";
export const dynamic="force-dynamic";
export const metadata={title:"Admin AI Workspace",robots:{index:false,follow:false}};
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const session=await chatSession();if(!session)redirect("/admin/login");
  const p=await searchParams;
  const conversationId=z.string().uuid().safeParse(p.conversationId),request=z.string().uuid().safeParse(p.requestId);
  const slug=typeof p.customerSlug==="string"?p.customerSlug:undefined;
  let data;
  try{
    const [saved,requests]=await Promise.all([workspaceData(session,conversationId.success?conversationId.data:undefined),listRequests()]);
    const requestId=saved.conversation ? saved.conversation.request_id || undefined : (request.success?request.data:undefined);
    const customerSlug=saved.conversation ? saved.conversation.customer_slug || undefined : slug;
    const context=await resolveChatContext(requestId,customerSlug);
    data={saved,requests,requestId,context};
  }catch{return <WebFactoryShell><PageIntro eyebrow="Private admin" title="AI Workspace unavailable" description="Conversation access or storage is unavailable. Check the database migration or start a new conversation."/><section className="wf-wrap wf-section"><Link href="/admin/ai">Start a new conversation</Link> · <Link href="/admin">Back to admin</Link></section></WebFactoryShell>;}
  return <WebFactoryShell><PageIntro eyebrow="Private admin workspace" title="Your website build partner." description="Prepare customer materials through conversation. Every answer is a draft; every action stays under your control."/>
    <section className="wf-wrap wf-section wf-chat-layout" style={{paddingTop:0}}>
      <aside className="wf-panel wf-chat-sidebar"><Link href="/admin">Back to dashboard</Link><h2>Business context</h2><strong>{data.context.title}</strong>
        <p>{data.context.customerSlug || "No customer selected"}</p>
        <details><summary>Review context sent with chat</summary><pre style={{whiteSpace:"pre-wrap",fontSize:12}}>{data.context.context}</pre></details>
        <p>Request details and AI briefs are unverified drafts. Dedicated email/phone fields are not included. Review free text before sending.</p>
        <form action="/admin/ai" className="wf-form"><label className="wf-field">Select a request<select name="requestId" defaultValue={data.requestId || ""}><option value="">General workspace</option>{data.requests.map(r=><option key={r.id} value={r.id}>{r.business}</option>)}</select></label><button className="wf-button secondary">New request chat</button></form>
        <form action="/admin/ai" className="wf-form"><label className="wf-field">Existing customer<select name="customerSlug" defaultValue=""><option value="">Select customer</option>{getCustomerSites().map(s=><option key={s.slug} value={s.slug}>{s.business.name}</option>)}</select></label><button className="wf-button secondary">New customer chat</button></form>
        <Link href="/admin/ai">New general chat</Link><h3>Saved in this admin session</h3><p>History persists in the database. For privacy, these links are accessible only during the same signed-in session.</p>
        <ul>{data.saved.history.map(c=><li key={c.id}><Link href={"/admin/ai?conversationId="+c.id}>{c.title}</Link></li>)}</ul>
      </aside>
      <AIChat key={conversationId.success?conversationId.data:data.requestId || slug || "general"} conversationId={conversationId.success?conversationId.data:randomUUID()} requestId={data.requestId || undefined} customerSlug={data.context.customerSlug || undefined} initialMessages={data.saved.messages} available={Boolean(process.env.OPENAI_API_KEY?.trim())} improve={p.improve==="1"}/>
    </section>
  </WebFactoryShell>;
}
