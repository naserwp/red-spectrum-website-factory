import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TemplateSite } from "@/components/template-site";
import { templates, type TemplateId } from "@/lib/factory/templates";

const pages = ["home", "services", "about", "contact", "privacy"] as const;
type PageName = (typeof pages)[number];

export function generateStaticParams() {
  return templates.flatMap((template) => [
    { template: template.id, page: undefined },
    ...pages.slice(1).map((page) => ({ template: template.id, page: [page] })),
  ]);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ template: string; page?: string[] }>;
}): Promise<Metadata> {
  const { template, page } = await params;
  const item = templates.find((entry) => entry.id === template);
  if (!item) return {};
  const label = page?.[0] ?? "home";
  return {
    title: `${item.name} — ${label[0].toUpperCase()}${label.slice(1)} template`,
    description: item.summary,
    icons: {
      icon: `/brand/${item.id}/favicon.svg`,
      shortcut: `/brand/${item.id}/favicon.svg`,
    },
    openGraph: {
      title: `${item.name} website template`,
      description: item.summary,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: `${item.name} website template`,
      description: item.summary,
    },
  };
}

export default async function TemplatePage({
  params,
}: {
  params: Promise<{ template: string; page?: string[] }>;
}) {
  const { template, page: segments } = await params;
  if (!templates.some((item) => item.id === template)) notFound();
  const page = (segments?.[0] ?? "home") as PageName;
  if (!pages.includes(page) || (segments?.length ?? 0) > 1) notFound();
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Draft business name",
    url: `https://preview.redspectrum.ai/templates/${template}`,
    description:
      "Illustrative template content. Replace with verified customer information.",
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <TemplateSite template={template as TemplateId} page={page} />
    </>
  );
}
