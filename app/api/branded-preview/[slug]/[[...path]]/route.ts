import {database} from '@/lib/webfactory/server';
import {getVerifiedWorkerBuild} from '@/lib/webfactory/build-worker';
import {previewProject,previewTeam} from '@/lib/webfactory/preview-verification';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:Promise<{slug:string;path?:string[]}>}){
 try{
  const {slug,path=[]}=await params;const url=new URL(request.url);
  if(url.hostname!=='preview.redspectrum.ai'||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||path.some(p=>p.includes('..')||/[\\%]/.test(p)))return new Response('Not found',{status:404});
  const requested=path.join('/');const page=['','services','about','contact','privacy'].includes(requested);
  const asset=/^_next\/static\/[a-zA-Z0-9_./-]+\.(?:js|css|woff2?)$/.test(requested)||new RegExp(`^customers/${slug}/(?:images/image-(?:[0-9]|1[01])\\.webp|(?:logo|logo-dark|mark|favicon|hero)\\.svg)$`).test(requested);
  if(!page&&!asset&&requested!=='_next/image')return new Response('Not found',{status:404});
  if(requested==='_next/image'){
   const source=url.searchParams.get('url')||'';
   if(!source.startsWith(`/customers/${slug}/`)||source.includes('..')||/[\\%?#]/.test(source)||!['w','q','url'].every(k=>url.searchParams.has(k))||[...url.searchParams.keys()].some(k=>!['w','q','url'].includes(k)))return new Response('Not found',{status:404});
  }
  const row=(await database().query('SELECT r.id,w.active_brief_id FROM webfactory.requests r JOIN webfactory.build_workflows w ON w.request_id=r.id WHERE r.customer_slug=$1',[slug])).rows[0];
  const verified=row?await getVerifiedWorkerBuild(row.id,slug,row.active_brief_id):null;
  if(!verified||!process.env.VERCEL_TOKEN)return new Response('Preview not available',{status:404});
  const projectResponse=await fetch(`https://api.vercel.com/v9/projects/${previewProject}?teamId=${previewTeam}`,{headers:{Authorization:`Bearer ${process.env.VERCEL_TOKEN}`},cache:'no-store',signal:AbortSignal.timeout(10000)});
  if(!projectResponse.ok)throw Error();const project=await projectResponse.json() as {id?:string;protectionBypass?:Record<string,{scope?:string}>};
  if(project.id!==previewProject)throw Error();
  const bypass=Object.entries(project.protectionBypass||{}).find(([,v])=>(v as {scope?:string}).scope==='automation-bypass')?.[0];
  if(verified.protection==='protected'&&!bypass)throw Error();
  const target=new URL(page?verified.previewUrl+(requested?'/'+requested:''):'/'+requested,new URL(verified.previewUrl).origin);
  if(requested==='_next/image')target.search=url.search;
  const upstream=await fetch(target,{headers:bypass?{'x-vercel-protection-bypass':bypass}:{},redirect:'error',cache:'no-store',signal:AbortSignal.timeout(20000)});
  if(!upstream.ok)throw Error();
  const headers={'Content-Type':upstream.headers.get('content-type')||'application/octet-stream','Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
  if(!page)return new Response(upstream.body,{headers});
  let html=await upstream.text();if(html.length>4000000)throw Error();
  // Only assets are rewritten. Customer navigation remains on the branded origin.
  html=html.replaceAll('/_next/',`/api/branded-preview/${slug}/_next/`).replaceAll(`/customers/${slug}/`,`/api/branded-preview/${slug}/customers/${slug}/`);
  // Encoded Next image input must remain the deployment-local source, not the proxy path.
  return new Response(html,{headers});
 }catch{return new Response('Preview temporarily unavailable',{status:503,headers:{'Cache-Control':'no-store'}});}
}
