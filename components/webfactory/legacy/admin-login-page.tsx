import { redirect } from "next/navigation";
import { isAdmin, adminConfigured } from "@/lib/webfactory/server";
import { WebFactoryShell, PageIntro } from "@/components/webfactory/shell";
import { LoginForm } from "@/components/webfactory/forms";
export const metadata = { title: "Admin Login", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function Page() { if (await isAdmin()) redirect("/admin"); return <WebFactoryShell><PageIntro eyebrow="RS WebFactory workspace" title="Welcome back." description="Sign in to review website requests and manage project progress."/><section className="wf-wrap wf-panel wf-login">{!adminConfigured()&&<p className="wf-status">Admin access is not configured for this environment.</p>}<LoginForm/></section></WebFactoryShell>; }
