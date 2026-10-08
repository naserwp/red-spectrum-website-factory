import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CustomerWebsite } from "@/components/customer-website";
import { UniqueHomeB2B } from "@/components/unique-home-b2b";
import { getCustomerSite, getCustomerSites } from "@/lib/customers/registry";
import { customerPages, type CustomerPage } from "@/lib/customers/schema";
import { getArticle } from "@/lib/customers/vitality-blog";
import { headers } from "next/headers";
import { customerDomainForHost } from "@/lib/customers/domains";
import { UniqueManagementWebsite } from '@/components/customers/unique-management-website';
import { umgService, validUmgRoute } from '@/lib/customers/umg-services';
import { BroomWebsite } from '@/components/customers/broom-website';
import { broomSlug, broomService, validBroomRoute } from '@/lib/customers/broom-content';

async function umgPreviewAllowed() {
  const h = await headers();
  const host = (h.get('host') || '').split(':')[0];
  return host === 'preview.redspectrum.ai' || host === 'red-spectrum-website-factory.vercel.app' || /^red-spectrum-website-factory-[a-z0-9-]+-naserwps-projects\.vercel\.app$/.test(host) || customerDomainForHost(host)?.slug === 'unique-management-group' || (process.env.NODE_ENV !== 'production' && host === 'localhost');
}

function validVitalityRoute(segments: string[] = []) {
  if (segments.length === 2) return segments[0] === "blog" && Boolean(getArticle(segments[1]));
  return segments.length === 1 && ["blog", "online-fitness-coaching", "personal-training", "nutrition-coaching", "body-assessment", "21-day-fitness-challenge", "privacy-policy", "terms-and-conditions", "health-and-fitness-disclaimer"].includes(segments[0]);
}

type RouteParams = { customerSlug: string; page?: string[] };

export const dynamicParams = true;

export function generateStaticParams() {
  return getCustomerSites().flatMap((customer) => customerPages.map((page): RouteParams => ({ customerSlug: customer.slug, page: page === "home" ? undefined : [page] }))).concat([
    { customerSlug: "360-vitality-fitness", page: ["blog"] },
    { customerSlug: "360-vitality-fitness", page: ["online-fitness-coaching"] },
    { customerSlug: "360-vitality-fitness", page: ["personal-training"] },
    { customerSlug: "360-vitality-fitness", page: ["nutrition-coaching"] },
    { customerSlug: "360-vitality-fitness", page: ["body-assessment"] },
    { customerSlug: "360-vitality-fitness", page: ["21-day-fitness-challenge"] },
    { customerSlug: "360-vitality-fitness", page: ["terms-and-conditions"] },
    { customerSlug: "360-vitality-fitness", page: ["health-and-fitness-disclaimer"] },
    { customerSlug: "unique-home-enterprise", page: ["thank-you"] },
  ]);
}

export async function generateMetadata({ params }: { params: Promise<RouteParams> }): Promise<Metadata> {
  const { customerSlug, page: segments } = await params;
  const site = getCustomerSite(customerSlug);
  if (!site) return {};
  if (customerSlug === broomSlug) {
    if (!validBroomRoute(segments)) return {};
    const service = broomService(segments?.[1]);
    const title = service ? service.name + ' | ' + site.business.name : segments?.[0] ? segments[0][0].toUpperCase() + segments[0].slice(1) + ' | ' + site.business.name : site.seo.title;
    const description = service?.intro || site.seo.description;
    const canonical = 'https://preview.redspectrum.ai/' + site.slug + (segments?.length ? '/' + segments.join('/') : '');
    return { metadataBase: new URL('https://preview.redspectrum.ai'), title: { absolute: title }, description, robots: { index: false, follow: false }, alternates: { canonical }, icons: { icon: site.branding.faviconPath }, openGraph: { title, description, url: canonical, type: 'website', siteName: site.business.name, images: [{ url: site.images.hero.src, alt: site.images.hero.alt }] }, twitter: { card: 'summary_large_image', title, description, images: [site.images.hero.src] } };
  }
  if (customerSlug === 'unique-management-group') {
    if (!await umgPreviewAllowed() || !validUmgRoute(segments)) return {};
    const requestHeaders = await headers();
    const domain = customerDomainForHost(requestHeaders.get("x-forwarded-host") ?? "") ?? customerDomainForHost(requestHeaders.get("host") ?? "");
    const production = domain?.slug === site.slug;
    const service = segments?.[1] ? umgService(segments[1]) : undefined;
    const title = service ? `${service.name} | ${site.business.name}` : segments?.[0] === 'thank-you' ? `Thank you | ${site.business.name}` : segments?.[0] ? `${segments[0][0].toUpperCase() + segments[0].slice(1)} | ${site.business.name}` : site.seo.title;
    const description = service?.overview || site.seo.description;
    const canonical = production ? `https://${domain.canonicalHost}${segments?.length ? '/' + segments.join('/') : ''}` : `https://preview.redspectrum.ai/${site.slug}${segments?.length ? '/' + segments.join('/') : ''}`;
    return { title: { absolute: title }, description, robots: production ? { index: true, follow: true } : { index: false, follow: false }, alternates: { canonical }, icons: { icon: site.branding.faviconPath }, openGraph: { title, description, url: canonical, type: 'website', images: [{ url: `https://${production ? domain.canonicalHost : 'preview.redspectrum.ai'}${site.images.hero.src}`, alt: site.images.hero.alt }] } };
  }
  if (customerSlug === "unique-home-enterprise" && segments?.length === 1 && segments[0] === "thank-you") {
    const requestHeaders = await headers();
    const domain = customerDomainForHost(requestHeaders.get("x-forwarded-host") ?? "") ?? customerDomainForHost(requestHeaders.get("host") ?? "");
    const production = domain?.slug === site.slug;
    return {
      title: { absolute: `Thank you | ${site.business.name}` },
      robots: { index: false, follow: false },
      alternates: { canonical: production ? `https://${domain.canonicalHost}/thank-you` : `https://preview.redspectrum.ai/${site.slug}/thank-you` },
    };
  }
  const page = (segments?.[0] ?? "home") as CustomerPage;
  const vitalityRoute = site.slug === "360-vitality-fitness" && validVitalityRoute(segments);
  const requestHeaders = await headers();
  const domain = customerDomainForHost(requestHeaders.get("x-forwarded-host") ?? "") ?? customerDomainForHost(requestHeaders.get("host") ?? "");
  const production = domain?.slug === site.slug;
  const canonical = production ? `https://${domain.canonicalHost}${segments?.length ? `/${segments.join("/")}` : ""}` : `https://preview.redspectrum.ai/${site.slug}${segments?.length ? `/${segments.join("/")}` : ""}`;
  if ((!customerPages.includes(page) && !vitalityRoute) || ((segments?.length ?? 0) > 1 && !vitalityRoute)) return {};
  return {
    metadataBase: new URL(production ? `https://${domain.canonicalHost}` : "https://preview.redspectrum.ai"),
    title: { absolute: page === "home" ? site.seo.title : `${site.pages[page]?.headline ?? (segments?.[0] === "blog" && segments[1] ? getArticle(segments[1])?.title : page.replaceAll("-", " "))} | ${site.business.name}` },
    description: site.seo.description,
    alternates: { canonical },
    icons: site.branding.faviconPath ? { icon: site.branding.faviconPath, shortcut: site.branding.faviconPath } : undefined,
    robots: production ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: { title: site.seo.title, description: site.seo.description, url: canonical, type: "website", siteName: site.business.name, images: [{ url: site.images.hero.src, alt: site.images.hero.alt }] },
    twitter: { card: "summary_large_image", title: site.seo.title, description: site.seo.description, images: [site.images.hero.src] },
  };
}

export default async function CustomerPageRoute({ params }: { params: Promise<RouteParams> }) {
  const { customerSlug, page: segments } = await params;
  const site = getCustomerSite(customerSlug);
  if (!site) notFound();
  if (customerSlug === broomSlug) {
    if (!validBroomRoute(segments)) notFound();
    return <BroomWebsite site={site} route={segments} />;
  }
  if (customerSlug === 'unique-management-group') {
    if (!await umgPreviewAllowed() || !validUmgRoute(segments)) notFound();
    return <UniqueManagementWebsite site={site} route={segments}/>;
  }
  if (customerSlug === "unique-home-enterprise" && segments?.length === 1 && segments[0] === "thank-you") return <UniqueHomeB2B site={site} page="thank-you" />;
  const page = (segments?.[0] ?? "home") as CustomerPage;
  const vitalityRoute = site.slug === "360-vitality-fitness" && validVitalityRoute(segments);
  if ((!customerPages.includes(page) && !vitalityRoute) || ((segments?.length ?? 0) > 1 && !vitalityRoute)) notFound();

  const requestHeaders = await headers();
  const domain = customerDomainForHost(requestHeaders.get("x-forwarded-host") ?? "") ?? customerDomainForHost(requestHeaders.get("host") ?? "");
  const production = domain?.slug === site.slug;
  const schema = {
    "@context": "https://schema.org",
    "@type": site.schema.type,
    name: site.business.name,
    description: site.schema.description,
    url: production ? `https://${domain.canonicalHost}` : `https://preview.redspectrum.ai/${site.slug}`,
    ...(site.contact.phone.status === "verified" ? { telephone: site.contact.phone.value } : {}),
    ...(site.contact.email.status === "verified" ? { email: site.contact.email.value } : {}),
    ...(site.contact.address.status === "verified" ? { address: site.contact.address.value } : {}),
    ...(site.contact.serviceAreas.status === "verified" ? { areaServed: site.contact.serviceAreas.value } : {}),
  };

  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replaceAll("<", "\\u003c") }} /><CustomerWebsite site={site} page={page} route={segments ?? []} /></>;
}
