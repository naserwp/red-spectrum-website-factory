import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CustomerWebsite } from "@/components/customer-website";
import { getCustomerSite, getCustomerSites } from "@/lib/customers/registry";
import { customerPages, type CustomerPage } from "@/lib/customers/schema";

type RouteParams = { customerSlug: string; page?: string[] };

export const dynamicParams = true;

export function generateStaticParams() {
  return getCustomerSites().flatMap((customer) => customerPages.map((page) => ({ customerSlug: customer.slug, page: page === "home" ? undefined : [page] })));
}

export async function generateMetadata({ params }: { params: Promise<RouteParams> }): Promise<Metadata> {
  const { customerSlug, page: segments } = await params;
  const site = getCustomerSite(customerSlug);
  if (!site) return {};
  const page = (segments?.[0] ?? "home") as CustomerPage;
  const canonical = `https://preview.redspectrum.ai/${site.slug}${page === "home" ? "" : `/${page}`}`;
  if (!customerPages.includes(page) || (segments?.length ?? 0) > 1) return {};
  return {
    metadataBase: new URL("https://preview.redspectrum.ai"),
    title: { absolute: page === "home" ? site.seo.title : `${site.pages[page].headline} | ${site.business.name}` },
    description: site.seo.description,
    alternates: { canonical },
    icons: site.branding.faviconPath ? { icon: site.branding.faviconPath, shortcut: site.branding.faviconPath } : undefined,
    robots: { index: false, follow: false },
    openGraph: { title: site.seo.title, description: site.seo.description, url: canonical, type: "website", siteName: site.business.name, images: [{ url: site.images.hero.src, alt: site.images.hero.alt }] },
    twitter: { card: "summary_large_image", title: site.seo.title, description: site.seo.description, images: [site.images.hero.src] },
  };
}

export default async function CustomerPageRoute({ params }: { params: Promise<RouteParams> }) {
  const { customerSlug, page: segments } = await params;
  const site = getCustomerSite(customerSlug);
  if (!site) notFound();
  const page = (segments?.[0] ?? "home") as CustomerPage;
  if (!customerPages.includes(page) || (segments?.length ?? 0) > 1) notFound();

  const schema = {
    "@context": "https://schema.org",
    "@type": site.schema.type,
    name: site.business.name,
    description: site.schema.description,
    url: `https://preview.redspectrum.ai/${site.slug}`,
    ...(site.contact.phone.status === "verified" ? { telephone: site.contact.phone.value } : {}),
    ...(site.contact.email.status === "verified" ? { email: site.contact.email.value } : {}),
    ...(site.contact.address.status === "verified" ? { address: site.contact.address.value } : {}),
    ...(site.contact.serviceAreas.status === "verified" ? { areaServed: site.contact.serviceAreas.value } : {}),
  };

  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replaceAll("<", "\\u003c") }} /><CustomerWebsite site={site} page={page} /></>;
}
