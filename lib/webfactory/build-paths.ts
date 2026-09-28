// Shared by control plane and worker. No arbitrary shared code or executable assets.
export function customerBuildPath(slug:string,file:string){
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||file.includes('..')||file.includes('\\')||file.startsWith('/'))return false;
 return file==='customers/manifest.json'||file===`customers/${slug}/site/customer.config.json`||file===`customers/${slug}/myndy/agent-context.md`||new RegExp(`^customers/${slug}/delivery/(brand-notes|image-inventory|research|missing-information|outreach|qa)\\.(md|json)$`).test(file)||new RegExp(`^public/customers/${slug}/(logo|logo-dark|mark|favicon|hero)\\.svg$`).test(file)||new RegExp(`^public/customers/${slug}/images/image-(?:[0-9]|1[01])\\.webp$`).test(file);
}
