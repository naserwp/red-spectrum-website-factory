import type { Metadata } from "next";
import Link from "next/link";
import { CustomerPreviews } from "@/components/webfactory/customer-previews";
import { customerPreviewCatalog } from "@/lib/webfactory/preview-catalog";
import { DesignGrid } from "@/components/webfactory/v2/public/design-grid";
import { V2Intro, V2Shell } from "@/components/webfactory/v2/shell";
import "@/components/webfactory/customer-previews.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Designs", description: "Red Spectrum website designs and public-safe customer preview examples.", alternates: { canonical: "https://webfactory.redspectrum.ai/designs" } };

export default async function DesignsPage() {
  const catalog = await customerPreviewCatalog();
  return <V2Shell><V2Intro eyebrow="Design explorer" title="A starting point. A world of possibilities." description="Explore curated directions for your next website. Each example uses sample content." /><section className="v2-container v2-section" style={{ paddingTop: 0 }}><DesignGrid filters /></section><section className="v2-container"><CustomerPreviews {...catalog} /></section><section className="v2-container v2-section"><Link className="v2-button v2-red" href="/request">Start a website request ↗</Link></section></V2Shell>;
}
