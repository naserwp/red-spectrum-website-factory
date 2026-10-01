import Link from "next/link";
import { designCatalog } from "@/components/webfactory/v2/catalog";
import { V2Intro, V2Shell } from "@/components/webfactory/v2/shell";

export const metadata = { title: "Page directory", robots: { index: false, follow: false } };

const groups = [
  ["Public", ["/", "/designs", "/request", "/processing", "/privacy", "/checkout"]],
  ["Admin", ["/admin/login", "/admin", "/admin/requests", "/admin/ai", "/admin/designs", "/admin/production", "/admin/delivery", "/admin/activity", "/admin/settings", "/admin/users", "/admin/integration"]],
  ["Client sample", ["/client/login", "/client", "/client/projects", "/client/projects/sample-project", "/client/messages", "/client/files", "/client/profile", "/client/delivery/sample-project"]],
] as const;

export default function Page() { return <V2Shell><V2Intro eyebrow="Page directory" title="Explore RS WebFactory" description="Public examples, protected admin workspaces and sample client screens." /><section className="v2-container v2-section v2-grid">{groups.map(([title, paths]) => <div className="v2-card" key={title}><h2>{title}</h2><div className="v2-list" style={{ marginTop: 20 }}>{paths.map((path) => <Link key={path} href={path}>{path} ↗</Link>)}</div></div>)}<div className="v2-card"><h2>Design directions</h2><div className="v2-list" style={{ marginTop: 20 }}>{designCatalog.map((design) => <Link key={design.slug} href={`/designs/${design.slug}`}>{design.name} ↗</Link>)}</div></div></section></V2Shell>; }
