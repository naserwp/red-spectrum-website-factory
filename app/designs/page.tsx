import type { Metadata } from "next";
import Link from "next/link";
import { CustomerPreviews } from "@/components/webfactory/customer-previews";
import { customerPreviewCatalog } from "@/lib/webfactory/preview-catalog";
import { DesignGrid } from "@/components/webfactory/v2/public/design-grid";
import { V2Intro, V2Shell } from "@/components/webfactory/v2/shell";
import "@/components/webfactory/customer-previews.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Designs and customer previews", description: "Explore design directions and existing customer website previews.", alternates: { canonical: "https://preview.redspectrum.ai/designs" } };

export default async function DesignsPage() {
  const catalog = await customerPreviewCatalog();
  return <V2Shell><V2Intro eyebrow="Designs and customer previews" title="A starting point. A world of possibilities." description="Explore sample designs and the existing customer preview catalog. Customer websites keep their own branding and URLs." /><section className="v2-container v2-section" style={{ paddingTop: 0 }}><DesignGrid filters /></section><section className="v2-container"><CustomerPreviews {...catalog} /></section><section className="v2-container v2-section"><Link className="v2-button v2-red" href="/request">Start a website request ↗</Link></section></V2Shell>;
}
