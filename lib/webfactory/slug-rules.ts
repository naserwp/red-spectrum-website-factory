export const reservedCustomerSlugs = new Set([
  "admin","api","designs","request","processing","checkout","payment","payments","privacy",
  "brief","standards","templates","login","logout","assets","public","customers","outputs",
  "favicon","robots","sitemap","_next",".well-known",
]);
export function slugError(slug:string):string|null {
  if(slug.length<2 || slug.length>80 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))return "Use 2–80 lowercase letters, numbers and single hyphens. No spaces or leading/trailing hyphens.";
  if(reservedCustomerSlugs.has(slug))return "This slug is reserved for a Factory route.";
  return null;
}
export function cleanSlug(business:string) {
  return business.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,70).replace(/-$/,"") || "customer";
}
export function previewUrls(slug:string){return {primary:`https://preview.redspectrum.ai/${slug}`,fallback:`https://red-spectrum-website-factory.vercel.app/${slug}`};}
// Match the original text, not URL-normalized paths, to reject traversal and encoded separators.
export function slugFromPreviewUrl(value:string):string|null {
  const match=/^https:\/\/(?:preview\.redspectrum\.ai|red-spectrum-website-factory\.vercel\.app)\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/.exec(value.trim());
  return match && !slugError(match[1]) ? match[1] : null;
}
