import { customerDomainForHost } from '@/lib/customers/domains';
import { broomServices, broomSlug } from '@/lib/customers/broom-content';

export function GET(request: Request) {
  const domain = customerDomainForHost(request.headers.get('host') || '');
  if (domain?.slug !== broomSlug) return new Response('Not found', { status: 404 });
  const paths = ['', '/services', '/about', '/contact', '/faq', '/privacy', ...broomServices.map(service => `/services/${service.slug}`)];
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(path => `<url><loc>https://${domain.canonicalHost}${path || '/'}</loc></url>`).join('')}</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
