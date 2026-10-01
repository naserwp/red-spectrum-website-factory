import {NextRequest,NextResponse} from 'next/server';
import {customerDomainForHost} from '@/lib/customers/domains';
import {validUmgRoute} from '@/lib/customers/umg-services';
// Routing only. Authentication stays in route handlers.
export function proxy(request:NextRequest){
  const hosts=[request.headers.get('x-forwarded-host'),request.headers.get('host'),request.nextUrl.hostname]
    .flatMap(value=>value?.split(',') ?? [])
    .map(value=>value.trim().toLowerCase().replace(/:\d+$/, '').replace(/\.+$/, ''));
  const host=hosts.find(value=>customerDomainForHost(value)) ?? '';
  const domain=customerDomainForHost(host);
  if(domain){
    const path=request.nextUrl.pathname;
    if(host==='www.uniquehomeenterprise.com'||host==='www.uniquemanagementgroup.com'){
      const canonical=request.nextUrl.clone();canonical.hostname=domain.canonicalHost;return NextResponse.redirect(canonical,308);
    }
    if(path===`/${domain.slug}`||path.startsWith(`/${domain.slug}/`)){
      const canonical=request.nextUrl.clone();canonical.pathname=path.slice(domain.slug.length+1)||'/';return NextResponse.redirect(canonical,308);
    }
    if(path===`/api/leads/${domain.slug}`)return NextResponse.next();
    const umg=domain.slug==='unique-management-group';
    const umgRoute=validUmgRoute(path.split('/').filter(Boolean));
    const allowedPage=umg?umgRoute:['/','/services','/about','/contact','/privacy','/thank-you'].includes(path.replace(/\/$/, '')||'/');
    if(path==='/admin'||path.startsWith('/admin/')||path==='/api'||path.startsWith('/api/')||path.startsWith('/_next/static/')===false&&path.startsWith('/_next/')===false&&path.startsWith('/customers/')===false&&!allowedPage)return new NextResponse('Not found',{status:404});
    if(path.startsWith('/customers/')&&!(umg?/^\/customers\/unique-management-group\/(?:images\/image-(?:[0-9]|1[0-5])\.webp|(?:logo|logo-dark|mark|favicon)\.svg)$/:/^\/customers\/unique-home-enterprise\/(?:images\/image-(?:[0-9]|1[01])\.webp|(?:logo|logo-dark|mark|favicon)\.svg)$/.test(path)))return new NextResponse('Not found',{status:404});
    if(path.startsWith('/_next/image')){
      const source=request.nextUrl.searchParams.get('url')||'';if(!source.startsWith(`/customers/${domain.slug}/`))return new NextResponse('Not found',{status:404});
    }
    if(allowedPage){
      const url=request.nextUrl.clone();url.pathname='/'+domain.slug+path;return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }
  if(request.nextUrl.hostname!=='preview.redspectrum.ai')return NextResponse.next();
  if(request.nextUrl.pathname==='/unique-management-group'||request.nextUrl.pathname.startsWith('/unique-management-group/'))return NextResponse.next();
 const parts=request.nextUrl.pathname.split('/').filter(Boolean);
 if(!parts.length||['api','admin','_next','customers','designs','request','processing','privacy','templates','brief','standards','checkout'].includes(parts[0]))return NextResponse.next();
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(parts[0])||parts.length>2)return NextResponse.next();
 const url=request.nextUrl.clone();url.pathname='/api/branded-preview/'+parts.join('/');return NextResponse.rewrite(url);
}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico).*)']};
