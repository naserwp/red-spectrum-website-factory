import "server-only";
import { getCustomerSite } from "@/lib/customers/registry";
import { canonicalCustomerUrl, slugFromCanonicalCustomerUrl } from "@/lib/customers/domains";
import { slugFromPreviewUrl, slugError } from "./slug-rules";

// A 200 response alone could be a fallback page or another tenant. Verify JSON-LD identity too.
export async function verifyCustomerRoute(slug:string,url:string):Promise<boolean>{
  const site=getCustomerSite(slug);
  if(!site || slugError(slug))return false;
  const local=/^http:\/\/(localhost|127\.0\.0\.1):\d{2,5}\/([a-z0-9-]+)$/.exec(url);
  if(slugFromPreviewUrl(url)!==slug && slugFromCanonicalCustomerUrl(url)!==slug && (!local || local[2]!==slug || process.env.VERCEL))return false;
  try{
    const response=await fetch(url,{redirect:'error',cache:'no-store',signal:AbortSignal.timeout(4000)});
    if(response.status!==200 || !response.headers.get('content-type')?.includes('text/html'))return false;
    const html=await response.text();
    return [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].some(match=>{
      try{const data=JSON.parse(match[1]);const accepted=new Set([`https://preview.redspectrum.ai/${slug}`,canonicalCustomerUrl(slug)].filter(Boolean));return data.name===site.business.name && accepted.has(data.url);}catch{return false;}
    });
  }catch{return false;}
}

export function localCustomerUrl(slug:string,host:string){
  return /^(localhost|127\.0\.0\.1):\d{2,5}$/.test(host) && !process.env.VERCEL?`http://${host}/${slug}`:null;
}
