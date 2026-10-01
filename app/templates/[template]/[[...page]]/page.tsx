import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TemplateSite } from "@/components/template-site";
import { designCatalog } from "@/components/webfactory/v2/catalog";
import { V2Template } from "@/components/webfactory/v2/previews/template";
import type { TemplateId } from "@/lib/factory/templates";

const sections = ["home", "services", "about", "work", "contact"] as const;
type Section = (typeof sections)[number];

export function generateStaticParams() {
  return designCatalog.flatMap((design) => [
    { template: design.template, page: undefined },
    ...sections.slice(1).map((page) => ({ template: design.template, page: [page] })),
    ...(["forge", "ledger", "stillwater"].includes(design.template) ? [{ template: design.template, page: ["privacy"] }] : []),
  ]);
}

export async function generateMetadata({ params }: { params: Promise<{ template: string; page?: string[] }> }): Promise<Metadata> {
  const { template, page } = await params;
  const design = designCatalog.find((item) => item.template === template);
  return design ? { title: `${design.name} — ${page?.[0] ?? "home"} example`, description: `Sample ${design.sector.toLowerCase()} website direction. ${design.description}`, robots: { index: false, follow: false } } : {};
}

export default async function TemplatePage({ params }: { params: Promise<{ template: string; page?: string[] }> }) {
  const { template, page } = await params;
  const design = designCatalog.find((item) => item.template === template);
  if (!design || (page?.length ?? 0) > 1) notFound();
  const section = page?.[0] ?? "home";
  if (section === "privacy" && ["forge", "ledger", "stillwater"].includes(template)) return <TemplateSite template={template as TemplateId} page="privacy" />;
  if (!sections.includes(section as Section)) notFound();
  return <V2Template design={design} section={section as Section} />;
}
