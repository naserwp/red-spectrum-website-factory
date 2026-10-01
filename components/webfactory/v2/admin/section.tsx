import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin, listRequests, type ProjectRequest } from "@/lib/webfactory/server";
import { designCatalog } from "../catalog";
import { AdminShell, V2Intro } from "../shell";

type Section = "requests" | "designs" | "production" | "delivery" | "activity" | "settings" | "users" | "integration";

const content: Record<Section, { title: string; description: string }> = {
  requests: { title: "Customer requests", description: "Review real submitted requests and open the protected build workspace." },
  designs: { title: "Design library", description: "Explore curated sample directions before applying one to a customer brief." },
  production: { title: "Production pipeline", description: "Request status comes from WebFactory storage. Build approvals remain in each protected request workspace." },
  delivery: { title: "Delivery", description: "Delivery packages require verified approval, private storage and a secure customer handoff." },
  activity: { title: "Workspace activity", description: "Open a request for its server-recorded action log and review history." },
  settings: { title: "Workspace settings", description: "Operational settings are managed through existing server configuration." },
  users: { title: "Team access", description: "Staff accounts and roles require a dedicated authorization service." },
  integration: { title: "Integrations", description: "Connection states are described without exposing credentials or private configuration." },
};

function RequestList({ requests, mode }: { requests: ProjectRequest[]; mode: Section }) {
  return requests.length ? <div className="v2-list">{requests.map((request) => <Link href={`/admin/requests/${request.id}`} key={request.id}><div><strong>{request.business}</strong><div><small>{request.industry} · Received {new Date(request.created_at).toLocaleDateString("en-US", { timeZone: "UTC" })}</small></div></div><span className="v2-badge">{request.status.replaceAll("_", " ")}</span><span aria-hidden>↗</span></Link>)}</div> : <div className="v2-empty">{mode === "delivery" ? "No delivery packages are available through the current backend." : "No customer requests have been received yet."}</div>;
}

export async function AdminSection({ section }: { section: Section }) {
  if (!await isAdmin()) redirect("/admin/login");
  const needsRequests = ["requests", "production", "activity"].includes(section);
  let requests: ProjectRequest[] = [];
  let available = true;
  if (needsRequests) try { requests = await listRequests(); } catch { available = false; }
  const copy = content[section];
  return <AdminShell><V2Intro eyebrow="Private admin workspace" title={copy.title} description={copy.description} /><section className="v2-container v2-section" style={{ paddingTop: 0 }}>
    {needsRequests && (available ? <RequestList requests={requests} mode={section} /> : <div className="v2-notice" role="status">Request storage is unavailable. No request data was loaded.</div>)}
    {section === "designs" && <div className="v2-grid">{designCatalog.map((design) => <article className="v2-card" key={design.slug}><span className="v2-badge">{design.ready ? "Preview ready" : "Direction pending"}</span><h3 style={{ margin: "15px 0 8px" }}>{design.name}</h3><p className="v2-muted">{design.sector}</p><div className="v2-actions" style={{ marginTop: 18 }}><Link className="v2-button v2-quiet" href={`/designs/${design.slug}`}>Open direction ↗</Link><Link className="v2-button v2-quiet" href={`/templates/${design.template}`}>Full example ↗</Link></div></article>)}</div>}
    {section === "delivery" && <div className="v2-two"><div className="v2-card"><h2>Handoff is pending</h2><p className="v2-muted">A verified private delivery manifest is not available in this backend. No sample download is presented as a customer package.</p><Link className="v2-button v2-quiet" href="/admin/requests">Review requests ↗</Link></div><div className="v2-card"><h3>Release gates</h3><p className="v2-muted">Preview, QA, approval, package review and separate deployment authorization are required.</p></div></div>}
    {section === "settings" && <div className="v2-card"><h2>Server-controlled settings</h2><p className="v2-muted">This staging screen is read-only. Changing operational controls requires a reviewed server-side change.</p><ul><li>Payments and recovery execution are disabled.</li><li>Publishing requires separate authorization.</li><li>Secrets are never displayed in this interface.</li></ul></div>}
    {section === "users" && <div className="v2-card"><h2>Team management unavailable</h2><p className="v2-muted">The current backend provides an administrator session but no staff directory or role-management API. User invitations and role changes are disabled.</p></div>}
    {section === "integration" && <div className="v2-card"><h2>Connected workflows</h2><ul><li>Request storage and admin authentication: existing WebFactory backend.</li><li>AI chat and build drafts: existing protected WebFactory endpoints.</li><li>Customer account and delivery storage: unavailable.</li><li>Payment, recovery and customer messaging: disabled.</li></ul><p className="v2-muted">Open the relevant protected workspace to confirm live availability. This screen does not reveal environment values.</p></div>}
  </section></AdminShell>;
}
