import { redirect } from "next/navigation";
import { isAdmin, adminConfigured } from "@/lib/webfactory/server";
import { LoginForm } from "@/components/webfactory/forms";
import { V2Shell } from "@/components/webfactory/v2/shell";

export const metadata = { title: "Admin Login", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function Page() {
  if (await isAdmin()) redirect("/admin");
  return <V2Shell><section className="v2-container v2-login-grid"><div className="v2-login-story"><span className="v2-eyebrow">RED SPECTRUM / INTERNAL OPERATIONS</span><h1>Good work starts with a clear view.</h1><p>One workspace for customer requests, creative direction, and careful delivery.</p></div><div className="v2-login-form"><span className="v2-badge">Protected admin access</span><h2 style={{ marginTop: 17 }}>Admin portal</h2><p>Sign in to review website requests and manage project progress.</p>{!adminConfigured() && <p className="v2-notice" role="status">Admin access is not configured for this environment.</p>}<LoginForm /></div></section></V2Shell>;
}
