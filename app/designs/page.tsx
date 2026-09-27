import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { WebFactoryShell } from "@/components/webfactory/shell";
import { CustomerPreviews } from "@/components/webfactory/customer-previews";
import { customerPreviewCatalog } from "@/lib/webfactory/preview-catalog";
import "@/components/webfactory/customer-previews.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Designs", description: "Red Spectrum website designs and customer preview examples." };

const designs = [
  { name: "Forge & Field", type: "Template · Home & property", href: "/templates/forge", image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80", note: "Bold architecture and direct paths to enquiry." },
  { name: "Ledger & Line", type: "Template · Professional services", href: "/templates/ledger", image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80", note: "Editorial hierarchy for considered advice." },
  { name: "Stillwater", type: "Template · Wellness & care", href: "/templates/stillwater", image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=80", note: "Calm, spacious design for personal services." },
];

export default async function DesignsPage() {
  const catalog = await customerPreviewCatalog();
  const groups = [
    { title: "Template designs", description: "Explore a starting direction. Your business gets its own content, branding and layout.", items: designs.slice(0, 3) },
  ];
  return <WebFactoryShell>
    <div className="wf-wrap wf-intro"><p className="wf-eyebrow">RS WebFactory designs</p><h1>A distinct direction for every business.</h1><p className="wf-lead">Browse our design starting points and customer previews. Find a direction you like, then tell us what makes your business different.</p><div className="wf-buttons"><Link className="wf-button" href="/request">Request your website ↗</Link></div></div>
    {groups.map(group => <section className="wf-wrap wf-section" key={group.title} style={{ paddingTop: 20 }}>
      <div className="wf-section-heading"><div><h2>{group.title}</h2><p className="wf-lead">{group.description}</p></div></div>
      <div className="wf-designs">{group.items.map(design => <article key={design.name} className="wf-design">
        <div className="wf-design-visual"><Image src={design.image} alt="" fill sizes="(max-width:760px) 100vw, 33vw" className="object-cover"/></div>
        <div className="wf-design-body"><small>{design.type}</small><h3>{design.name}</h3><p>{design.note}</p><Link href={design.href} className="wf-text-link">Preview website <ArrowUpRight size={17}/></Link></div>
      </article>)}</div>
    </section>)}
    <CustomerPreviews {...catalog}/>
  </WebFactoryShell>;
}
