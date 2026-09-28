import {NextRequest,NextResponse} from 'next/server';
// Routing only. Authentication stays in route handlers.
export function proxy(request:NextRequest){
 if(request.nextUrl.hostname!=='preview.redspectrum.ai')return NextResponse.next();
 const parts=request.nextUrl.pathname.split('/').filter(Boolean);
 if(!parts.length||['api','admin','_next','customers','designs','request','processing','privacy','templates','brief','standards','checkout'].includes(parts[0]))return NextResponse.next();
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(parts[0])||parts.length>2)return NextResponse.next();
 const url=request.nextUrl.clone();url.pathname='/api/branded-preview/'+parts.join('/');return NextResponse.rewrite(url);
}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico).*)']};
