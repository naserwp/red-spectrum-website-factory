import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {command} from './runtime.mjs';
let axeSource;
export async function verifyManagementPage({browser,record,page,width,repo,job,env}){
 const result=JSON.parse(await browser('eval',`(()=>{
  const all=s=>[...document.querySelectorAll(s)],root='/unique-management-group';
  const h=all('h1'),headings=all('h1,h2,h3');let previous=0;
  const hierarchy=headings.every(e=>{const n=+e.tagName[1],ok=n<=previous+1;previous=n;return ok});
  const links=all('a[href]'),brokenAnchors=links.filter(a=>a.getAttribute('href').startsWith('#')).some(a=>!document.querySelector(a.getAttribute('href')));
  const missingLabels=all('input,select,textarea').filter(e=>!e.labels?.length);
  const externalScripts=all('script[src]').filter(e=>new URL(e.src).origin!==location.origin);
  return {oneHeading:h.length===1,hierarchy,main:all('main').length===1,skip:!!document.querySelector('a[href="#umg-main"]'),labels:!missingLabels.length,alt:all('img').every(i=>!!i.alt),formsDisabled:all('input,textarea,select,button').every(e=>e.disabled),links:!brokenAnchors&&links.every(a=>{const u=a.getAttribute('href');return u.startsWith(root)||u.startsWith('#')||u.startsWith('tel:')||u.startsWith('mailto:')||u==='https://www.theredspectrum.com/'}),canonical:document.querySelector('link[rel="canonical"]')?.href==='https://preview.redspectrum.ai'+location.pathname,description:!!document.querySelector('meta[name="description"]')?.content,og:!!document.querySelector('meta[property="og:image"]'),noThirdPartyScripts:!externalScripts.length,services:location.pathname.endsWith('/services')?all('.umg-service-detail').length===7:true,logo:document.querySelector('.umg-logo img')?.getAttribute('src')==='/customers/unique-management-group/logo.svg',imageCount:document.images.length,resources:performance.getEntriesByType('resource').map(r=>({type:r.initiatorType,bytes:r.transferSize,duration:Math.round(r.duration)})),domContentLoaded:Math.round(performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd),scrollWidth:document.documentElement.scrollWidth,width:innerWidth};
 })()`));
 const checks=['oneHeading','hierarchy','main','skip','labels','alt','formsDisabled','links','canonical','description','og','noThirdPartyScripts','services','logo'];
 record.assert('browser-check',checks.every(k=>result[k]===true),page,width);
 const dir=repo.dir+'.qa';await mkdir(dir,{recursive:true});
 await writeFile(path.join(dir,`${page.slice(1)||'home'}-${width}.json`),JSON.stringify(result,null,2));
 await browser('screenshot',path.join(dir,`${page.slice(1)||'home'}-${width}.png`),'--full');
 if(width===320){
  await browser('press','Tab');const focused=JSON.parse(await browser('eval',`({skip:document.activeElement?.className==='umg-skip',outline:getComputedStyle(document.activeElement).outlineStyle})`));
  record.assert('browser-check',focused.skip&&focused.outline!=='none',page,width);
 }
 if(page===''&&width===1440){
  const source=await readFile(path.join(repo.dir,'public/customers/unique-management-group/logo.svg'));
  record.assert('artifact-integrity',createHash('sha256').update(source).digest('hex')===job.requestedChanges.match(/logo-sha256:([a-f0-9]{64})/)?.[1],page,width);
 }
 {
  // Inject a pinned, independent accessibility audit into the QA browser only.
  // This code is not part of the delivered website or its dependencies.
  if(!axeSource){const response=await fetch('https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.3/axe.min.js');if(!response.ok)throw Error('QA_FAILED');axeSource=await response.text();}
  await writeFile(path.join(dir,'axe-version.txt'),'axe-core 4.10.3, cdnjs; QA only');
  await command(process.execPath,[env.AGENT_BROWSER_CLI,'--session','qa-'+job.id,'eval','--stdin'],repo.dir,{},45000,axeSource+'\n;true');
  const audit=JSON.parse(await browser('eval',`(async()=>{const a=await axe.run(document.querySelector('.umg'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});return {violations:a.violations,passes:a.passes.map(p=>p.id),incomplete:a.incomplete.map(p=>({id:p.id,description:p.description}))}})()`));
  await writeFile(path.join(dir,`axe-${page.slice(1)||'home'}-${width}.json`),JSON.stringify(audit,null,2));record.assert('browser-check',audit.violations.length===0,page,width);
 }
}
