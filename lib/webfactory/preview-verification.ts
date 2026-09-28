// Server/worker only. Credentials stay in memory and are never returned in evidence.
export const previewProject = 'prj_HV68RI67tT0LXTfEA1mguG6F3Ddo';
export const previewTeam = 'team_jaE4H8Ibm6itfUNg5ZrhI7Bi';
type Input = {previewUrl:string;deploymentReference:string;resultSha:string;slug:string;business:string};
type Options = {apiGet:(endpoint:string)=>Promise<unknown>;otherNames?:readonly string[];privateValues?:readonly string[]};
type Deployment = {projectId?:string;target?:string;readyState?:string;url?:string;meta?:{githubCommitSha?:string}};
type Project = {id?:string;ssoProtection?:unknown;protectionBypass?:Record<string,{scope?:string}>};
export async function verifyProtectedPreview(input:Input,options:Options){
 try{
  const url=new URL(input.previewUrl);
  if(url.protocol!=='https:'||!/^[a-z0-9-]+\.vercel\.app$/.test(url.hostname)||url.username||url.password||url.port||url.search||url.hash||url.pathname!==`/${input.slug}`||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug)||!/^dpl_[A-Za-z0-9]+$/.test(input.deploymentReference))throw Error();
  const d=await options.apiGet(`/v13/deployments/${input.deploymentReference}?teamId=${previewTeam}`) as Deployment;
  if(d.projectId!==previewProject||d.target==='production'||d.readyState!=='READY'||d.url!==url.hostname||d.meta?.githubCommitSha!==input.resultSha)throw Error();
  let bypass:string|undefined,protectedAccess=false;
  const pages:string[]=[];
  for(const page of ['','/services','/about','/contact','/privacy']){
   const target=input.previewUrl+page;
   let response=await fetch(target,{redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(10000)});
   if(response.status!==200){
    const location=response.headers.get('location');
    const redirect=location?new URL(location,target):null;
    const authRedirect=redirect?.protocol==='https:'&&redirect.hostname==='vercel.com'&&redirect.pathname==='/sso-api';
    if(!authRedirect&&![401,403].includes(response.status))throw Error();
    if(!bypass){
     const project=await options.apiGet(`/v9/projects/${previewProject}?teamId=${previewTeam}`) as Project;
     if(project.id!==previewProject||!project.ssoProtection)throw Error();
     // Reuse an existing authorized automation bypass; never create/rotate one here.
     bypass=Object.entries(project.protectionBypass||{}).find(([key,value])=>value.scope==='automation-bypass'&&key.length>=16)?.[0];
     if(!bypass)throw Error();
    }
    // Only the independently verified exact deployment host receives this header.
    // Never follow redirects with credentials; never put them in URLs or cookies.
    response=await fetch(target,{redirect:'error',cache:'no-store',headers:{'x-vercel-protection-bypass':bypass},signal:AbortSignal.timeout(10000)});
    protectedAccess=true;
   }
   if(response.status!==200)throw Error();
   const html=await response.text();if(html.length>4000000)throw Error();
   const identity=[...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].some(m=>{try{const data=JSON.parse(m[1]);return data.name===input.business&&data.url===`https://preview.redspectrum.ai/${input.slug}`;}catch{return false;}});
   if(!identity||!html.includes('noindex')||!html.includes('<title>'))throw Error();
   if([...(options.privateValues||[]),'BUILD_WORKER_SECRET','LEADS_DATABASE_URL','OPENAI_API_KEY',...(options.otherNames||[])].filter(Boolean).some(s=>html.includes(s)))throw Error();
   const links=[...html.matchAll(/<a\b[^>]*\bhref="(\/[^"]*)"/g)].map(m=>m[1].split(/[?#]/)[0]);
   if(links.some(p=>p!==`/${input.slug}`&&!p.startsWith(`/${input.slug}/`))||!['','/services','/about','/contact','/privacy'].every(p=>links.includes('/'+input.slug+p)))throw Error();
   pages.push(page||'/');
  }
  return {preview_deployment_exists:true,preview_authenticated_access_verified:true,preview_customer_identity_verified:true,preview_public_access:protectedAccess?'protected' as const:'public' as const,pages,verified_at:new Date().toISOString()};
 }catch{throw Error('PREVIEW_VERIFICATION_FAILED');}
}
