import { broomService, broomSlug } from './broom-content';
import { customerDomainForHost } from './domains';

// A future domain must be explicitly registered and verified. Request headers
// alone cannot activate a customer domain or change preview indexing.
export function broomLocation(host: string) {
  const domain = customerDomainForHost(host);
  const production = domain?.slug === broomSlug && domain.status === 'verified';
  return {
    origin: production ? `https://${domain.canonicalHost}` : 'https://preview.redspectrum.ai',
    root: production ? '' : `/${broomSlug}`,
    production,
  };
}

const descriptions: Record<string, string> = {
  home: 'Move with confidence. Broom Home Enterprises LLC offers thoughtful real estate guidance for renting, buying, selling, building and long-term ownership.',
  services: 'Explore five ways forward with Broom Home: rental properties, buying, selling, building and holding. Find the right starting point for your plans.',
  about: 'Meet Broom Home Enterprises LLC and discover our approach to real estate: clear communication, professional guidance and relationships built around your priorities.',
  contact: 'Contact Aminul Haque at Broom Home Enterprises LLC. Call (347) 666-3929 or email info@broomhome.biz to discuss your next real estate move.',
  faq: 'Find answers to common questions about Broom Home real estate services, preparing for a conversation, property imagery and contacting the team.',
  privacy: 'Read the Broom Home privacy notice, including contact inquiries, email notifications, technical information and illustrative photography.',
};

export function broomSeo(route: string[] = []) {
  const page = route[0] || 'home';
  const service = route[0] === 'services' ? broomService(route[1]) : undefined;
  const label = service?.name || ({ home: 'Real Estate Guidance', services: 'Real Estate Services', about: 'About Our Approach', contact: 'Contact Our Team', faq: 'Frequently Asked Questions', privacy: 'Privacy Notice' } as Record<string, string>)[page];
  return { title: `${label} | Broom Home Enterprises LLC`, description: service?.intro || descriptions[page] };
}
