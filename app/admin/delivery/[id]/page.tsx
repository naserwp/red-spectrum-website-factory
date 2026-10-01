import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { database, isAdmin } from "@/lib/webfactory/server";
import { AdminShell, V2Intro } from "@/components/webfactory/v2/shell";

export const dynamic = "force-dynamic";
export const metadata = { title: "Delivery review", robots: { index: false, follow: false } };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  if (!await isAdmin()) redirect("/admin/login");
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  let request: { business: string } | undefined;
  try { request = (await database().query<{ business: string }>("SELECT business FROM webfactory.requests WHERE id=$1", [id])).rows[0]; } catch {
    return <AdminShell><V2Intro eyebrow="Private admin workspace" title="Delivery unavailable" description="Request storage could not be loaded." /></AdminShell>;
  }
  if (!request) notFound();
  return <AdminShell><V2Intro eyebrow="Private admin workspace" title={`Delivery · ${request.business}`} description="Package handoff requires a verified private manifest and customer authorization." /><section className="v2-container v2-card"><h2>No verified delivery package</h2><p className="v2-muted">This backend does not expose a secure delivery manifest for this request. No sample file is offered as a real package.</p><Link href={`/admin/requests/${id}`} className="v2-button v2-quiet">Open protected request ↗</Link></section></AdminShell>;
}
