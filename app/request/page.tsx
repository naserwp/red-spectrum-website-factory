import { randomUUID } from "node:crypto";
import Link from "next/link";
import { RequestForm } from "@/components/webfactory/forms";
import { designCatalog } from "@/components/webfactory/v2/catalog";
import { V2Shell } from "@/components/webfactory/v2/shell";

export const dynamic = "force-dynamic";
export const metadata = { title: "Customer Request", robots: { index: false, follow: false } };

export default async function Page({ searchParams }: { searchParams: Promise<{ design?: string }> }) {
  const { design } = await searchParams;
  const selected = designCatalog.find((item) => item.name === design)?.name;
  return <V2Shell><section className="v2-container v2-login-grid" style={{ alignItems: "start" }}><div><span className="v2-badge">YOUR NEXT WEBSITE STARTS HERE</span><h1 style={{ margin: "19px 0" }}>Big ideas.<br />A clear first step.</h1><p className="v2-muted">Tell us about your business and the website you want to create. This form saves to the real WebFactory request backend when storage is available.</p><div className="v2-journey" style={{ gridTemplateColumns: "1fr", marginTop: 30 }}>{[["01", "Share your business"], ["02", "Set the creative direction"], ["03", "Review your request"]].map(([number, title]) => <div className="v2-card" key={number}><span className="v2-eyebrow">{number}</span><h3>{title}</h3></div>)}</div><div className="v2-notice" style={{ marginTop: 22 }}>Please keep passwords, payment details and sensitive personal information out of your brief.</div><Link href="/privacy" className="v2-button v2-quiet" style={{ marginTop: 18 }}>Read privacy notice ↗</Link></div><div className="v2-login-form"><h2>Website request</h2><p>Give your new website a little direction.</p>{selected && <p className="v2-badge" style={{ marginBottom: 20 }}>Selected direction: {selected}</p>}<RequestForm submissionId={randomUUID()} initialDetails={selected ? `Design direction: ${selected}.\n\n` : ""} /></div></section></V2Shell>;
}
