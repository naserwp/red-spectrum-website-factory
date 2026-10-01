import { redirect } from "next/navigation";
import { isAdmin, adminConfigured } from "@/lib/webfactory/server";
import { WebFactoryShell } from "@/components/webfactory/shell";
import { LoginForm } from "@/components/webfactory/forms";
export const metadata = { title: "Admin Login", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function Page() { if (await isAdmin()) redirect("/admin"); return <WebFactoryShell><section className="wf-wrap wf-auth-layout"><div className="wf-auth-story"><p className="wf-eyebrow">Red Spectrum · Internal workspace</p><h1>Good work starts with a clear view.</h1><p>Sign in to review customer requests, manage build progress and keep each approval deliberate.</p><span className="wf-badge">Authorized staff only</span></div><div className="wf-panel wf-auth-card"><h2>Admin login</h2><p>Use your assigned account to continue to the secure workspace.</p>{!adminConfigured()&&<p className="wf-status">Admin access is not configured for this environment.</p>}<div className="wf-login"><LoginForm/></div></div></section></WebFactoryShell>; }
