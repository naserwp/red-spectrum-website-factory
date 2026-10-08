import "server-only";
import {headers} from "next/headers";
import {getCustomerSites} from "@/lib/customers/registry";
import {getLocalBuildReceipt} from "./build-receipts";
import {database,isAdmin} from "./server";
import {canonicalCustomerUrl} from "@/lib/customers/domains";
import {slugError,slugFromPreviewUrl,previewUrls} from "./slug-rules";
import {verifyCustomerRoute,localCustomerUrl} from "./route-readiness";

export type PreviewCard={key:string;name:string;industry:string;description:string;slug:string|null;image:string|null;status:'building'|'build approved'|'preview ready'|'changes requested'|'approved';href:string|null;admin?:{requestStatus:string;requestHref:string;updatedAt:string;actionCount:number}};
type RequestRow={id:string;business:string;industry:string;status:string;customer_slug:string|null;stage:string|null;preview_url:string|null;review_status:string|null;review_url:string|null;updated_at:Date|string;action_count?:string};
const safeLabel=(value:string,max:number)=>value.replace(/\b[^\s@]+@[^\s@]+\.[^\s@]+\b/g,'[contact omitted]').replace(/(?:\+?\d[\d(). -]{7,}\d)/g,'[contact omitted]').replace(/https?:\/\/\S+/gi,'[link omitted]').slice(0,max);
export function publicRequestStatus(row:Pick<RequestRow,'stage'|'status'|'review_status'>):PreviewCard['status']{
  if(['changes_requested','rebuilding'].includes(row.review_status || ''))return 'changes requested';
  if(row.stage==='customer_approved' || row.status==='approved' || row.review_status==='approved')return 'approved';
  if(row.stage==='preview_ready' || row.status==='preview_ready' || row.review_status==='preview_ready')return 'preview ready';
  if(row.stage==='build_approved')return 'build approved';
  return 'building';
}
// Do not spread database records into client props. Only this allowlisted DTO crosses the boundary.
export function assemblePreviewCards(rows:RequestRow[],admin:boolean):PreviewCard[]{
  const sites=getCustomerSites();
  const cards=new Map<string,PreviewCard>(sites.map(site=>[site.slug,{key:site.slug,name:safeLabel(site.business.name,140),industry:safeLabel(site.business.industry,100),description:'An independent customer website preview. Content and integrations remain subject to review.',slug:site.slug,image:site.images.hero.src.startsWith(`/customers/${site.slug}/`)?site.images.hero.src:null,status:site.status==='approved'?'approved':'preview ready',href:`/${site.slug}`} ]));
  for(const row of rows){
    const receipt=getLocalBuildReceipt(row.id);
    const slug=row.customer_slug && !slugError(row.customer_slug)?row.customer_slug:receipt?.customerSlug || null;
    if(!slug && !row.preview_url && !row.review_url)continue;
    const existing=slug?cards.get(slug):undefined;
    const card:PreviewCard=existing || {key:slug || `pending-${cards.size}`,name:safeLabel(row.business,140),industry:safeLabel(row.industry,100),description:'Website preparation is in progress. The preview link will appear once the customer route is built and registered.',slug,image:null,status:'building',href:null};
    card.status=publicRequestStatus(row);
    if(admin)card.admin={requestStatus:row.status,requestHref:`/admin/requests/${row.id}`,updatedAt:new Date(row.updated_at).toISOString(),actionCount:Number(row.action_count || 0)};
    cards.set(card.key,card);
  }
  return [...cards.values()];
}
async function reachable(url:string){const slug=slugFromPreviewUrl(url);return Boolean(slug && await verifyCustomerRoute(slug,url));}
export async function resolvePreviewLink(slug:string,saved:string|null|undefined,host:string,check:(url:string)=>Promise<boolean>=reachable):Promise<string|null>{
  if(slugError(slug))return null;
  const urls=previewUrls(slug);
  // Only exact, tenant-matching allowlisted URLs may be checked or returned.
  const verified=new Map<string,Promise<boolean>>();
  const ready=(url:string)=>{if(!verified.has(url))verified.set(url,check(url));return verified.get(url)!;};
  if(saved && slugFromPreviewUrl(saved)===slug && await ready(saved))return saved;
  // A working customer page verifies DNS, TLS and route readiness together.
  if(await ready(urls.primary))return urls.primary;
  if(await ready(urls.fallback))return urls.fallback;
  const canonical=canonicalCustomerUrl(slug);
  if(canonical && await check(canonical))return canonical;
  // Undeployed registered sites remain inspectable locally, never linked as live previews.
  const local=localCustomerUrl(slug,host);
  return local && await check(local)?`/${slug}`:null;
}
export async function customerPreviewCatalog(){
  const admin=await isAdmin(),host=(await headers()).get('host') || '';
  let rows:RequestRow[]=[],unavailable=false;
  try{
    // No email, phone, request description, notes, brief or action contents are selected.
    rows=(await database().query<RequestRow>(`SELECT r.id,r.business,r.industry,r.status,r.customer_slug,r.updated_at,w.stage,w.preview_url,v.review_status,v.preview_url AS review_url ${admin?',(SELECT count(*) FROM webfactory.request_actions a WHERE a.request_id=r.id) AS action_count':''} FROM webfactory.requests r LEFT JOIN webfactory.build_workflows w ON w.request_id=r.id LEFT JOIN LATERAL (SELECT review_status,preview_url FROM webfactory.request_review_events WHERE request_id=r.id AND kind='review' ORDER BY created_at DESC LIMIT 1) v ON true WHERE r.customer_slug IS NOT NULL OR w.stage IN ('build_approved','preview_ready','customer_approved') OR w.preview_url IS NOT NULL OR NULLIF(v.preview_url,'') IS NOT NULL ORDER BY r.updated_at ASC`)).rows;
  }catch{unavailable=true;}
  // Include known exact request-to-build receipts even before its saved slug is confirmed.
  // Registry sites already appear without a database association; never match by business name.
  const cards=assemblePreviewCards(rows,admin);
  await Promise.all(cards.filter(card=>card.href && card.slug).map(async card=>{
    const row=rows.find(row=>row.customer_slug===card.slug || getLocalBuildReceipt(row.id)?.customerSlug===card.slug);
    const saved=row?.preview_url || row?.review_url;
    card.href=await resolvePreviewLink(card.slug!,saved,host,url=>verifyCustomerRoute(card.slug!,url));
  }));
  // Reachability controls the link, never the persisted approval status.
  return {cards,admin,unavailable};
}
