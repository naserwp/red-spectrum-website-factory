import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/webfactory/server";
import { AdminShell, V2Intro } from "@/components/webfactory/v2/shell";
export const dynamic = "force-dynamic";
export const metadata = { title: "Recovery pilot unavailable", robots: { index: false, follow: false } };
export default async function Page() { if (!await isAdmin()) redirect("/admin/login"); return <AdminShell><V2Intro eyebrow="Private admin workspace" title="Recovery pilot unavailable" description="No verified recovery pilot backend is connected to RS WebFactory." /><section className="v2-container v2-card"><h2>Execution disabled</h2><p className="v2-muted">No customer qualification, payment method, amount, approval or charge is inferred from the prototype. Recovery execution remains disabled.</p></section></AdminShell>; }
