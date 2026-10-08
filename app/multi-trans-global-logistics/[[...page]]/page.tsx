import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MtgWebsite } from '@/components/customers/mtg-website';
import { mtgBase, mtgName, mtgPages, mtgService, mtgServices, validMtgRoute } from '@/lib/customers/mtg-content';

type Params = { page?: string[] };
const descriptions: Record<string, [string, string]> = {
  '': ['Trucking & Freight', 'Explore dry van trucking, freight forwarding and logistics with Multi Trans Global Logistics. Discuss your route, cargo and timing.'],
  about: ['About Multi Trans', 'Learn about Multi Trans Global Logistics and start a practical conversation about trucking, dry van freight and shipment coordination.'],
  services: ['Freight Services', 'Explore 16 trucking and logistics service guides, including dry van, LTL, FTL, refrigerated freight and forwarding. Availability requires confirmation.'],
  industries: ['Industries & Freight', 'Prepare an inquiry for packaged goods, manufacturing freight, building materials and specialized cargo. Confirm acceptance with Multi Trans.'],
  'service-areas': ['Service Areas', 'Discuss pickup and delivery locations with Multi Trans Global Logistics. Current route coverage and shipment availability require confirmation.'],
  faq: ['Freight Questions', 'Find answers about quote information, load options, service areas, specialized freight and preparing your Multi Trans inquiry.'],
  'request-a-quote': ['Request a Freight Quote', 'Prepare a freight inquiry with route, cargo, dimensions and timing. Review and copy your summary or choose to email Multi Trans directly.'],
  contact: ['Contact Multi Trans', 'Call (773) 592-9382 or email mtglobal39@gmail.com to discuss freight with Multi Trans Global Logistics.'],
  privacy: ['Privacy Notice', 'Read how the Multi Trans preview handles quote-planner information, email links and technical data. Business approval pending.'],
  terms: ['Website Terms', 'Review the draft website terms for the Multi Trans preview, including inquiries, service confirmation and illustrative imagery.'],
  cookies: ['Cookies & Storage', 'Read about cookies and browser storage on the Multi Trans website preview. No marketing tracking is added to these customer pages.'],
};
export function generateStaticParams(): Params[] { return [...mtgPages.map(page => ({ page: page ? [page] : [] })), ...mtgServices.map(service => ({ page: ['services', service.slug] }))]; }
export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { page = [] } = await params;
  if (!validMtgRoute(page)) return { robots: { index: false, follow: false } };
  const service = mtgService(page[1]);
  const [label, description] = service ? [service.name, service.intro] : descriptions[page[0] || ''];
  const title = `${label} | Multi Trans Global Logistics`;
  const canonical = `https://preview.redspectrum.ai${mtgBase}${page.length ? '/' + page.join('/') : ''}`;
  const image = '/customers/multi-trans-global-logistics/social.png';
  return { title: { absolute: title }, description, applicationName: mtgName, metadataBase: new URL('https://preview.redspectrum.ai'), robots: { index: false, follow: false }, alternates: { canonical }, icons: { icon: '/customers/multi-trans-global-logistics/favicon.svg', shortcut: '/customers/multi-trans-global-logistics/favicon.svg' }, openGraph: { type: 'website', title, description, siteName: mtgName, url: canonical, images: [{ url: image, width: 1200, height: 630, alt: 'Multi Trans Global Logistics — Freight in Motion. Business Moving Forward.' }] }, twitter: { card: 'summary_large_image', title, description, images: [image] } };
}
export default async function MultiTransPage({ params }: { params: Promise<Params> }) { const { page = [] } = await params; if (!validMtgRoute(page)) notFound(); return <MtgWebsite route={page} />; }
