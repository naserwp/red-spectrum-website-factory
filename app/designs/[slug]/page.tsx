import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { designCatalog, getDesign } from "@/components/webfactory/v2/catalog";
import { V2Shell } from "@/components/webfactory/v2/shell";

export function generateStaticParams() { return designCatalog.map(({ slug }) => ({ slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const design = getDesign((await params).slug);
  return design ? { title: design.name, description: design.description, alternates: { canonical: `https://webfactory.redspectrum.ai/designs/${design.slug}` } } : {};
}

export default async function DesignPage({ params }: { params: Promise<{ slug: string }> }) {
  const design = getDesign((await params).slug);
  if (!design) notFound();
  return <V2Shell><section className="v2-container v2-section"><Link href="/designs" className="v2-muted">← Back to designs</Link><div className="v2-section-head" style={{ marginTop: 30 }}><div><span className="v2-badge">{design.sector}</span><h1 style={{ margin: "12px 0" }}>{design.name}</h1><p className="v2-muted">{design.description}</p></div><div className="v2-actions"><Link href={`/templates/${design.template}`} className="v2-button v2-quiet">Open full example ↗</Link><Link href={`/request?design=${encodeURIComponent(design.name)}`} className="v2-button v2-red">Request this direction ↗</Link></div></div><div className="v2-showcase"><Image src={`/v2/designs/design-${design.image}.jpg`} width={1200} height={720} alt={`${design.name} visual direction`} priority /><div><small>CURATED WEBSITE DIRECTION</small><h2>{design.name}</h2><p>Made for a distinctive first impression.</p></div></div><div className="v2-trust"><span>Responsive layout</span><span>Clear content hierarchy</span><span>Customer-focused navigation</span></div></section></V2Shell>;
}
