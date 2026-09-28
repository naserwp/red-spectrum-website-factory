// Reviewed, customer-specific build adapter. The authoring provider is the
// OpenAI GPT-6 Astra agent in the explicitly authorized redesign session.
// Uses the ordinary worker lease, scope, QA, deployment and completion gates.
import {readFile,writeFile,mkdir,lstat} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {customerSiteSchema,customerManifestSchema} from '../../lib/customers/schema.ts';
const slug='unique-management-group';
export const services=[
 ['Administrative Management','Streamline day-to-day administrative operations with a focus on productivity, coordination, and control.'],
 ['Reorganizational Consulting','Review how your business is structured and consider changes that support efficiency, scalability, and renewed growth.'],
 ['Site Location Consulting','Assess office or facility placement in the context of your business needs and operational priorities.'],
 ['Business Management','Strategic advice focused on company structure, performance, and profitability.'],
 ['General Management','A broad consulting perspective on organizational, operational, and leadership challenges.'],
 ['Records Management','Develop more organized approaches to data and records, with attention to compliance and security needs.'],
 ['Real Estate Management','Property oversight spanning rentals, maintenance, tenant relations, and property performance.'],
];
const photos=[
 ['1497366811353-6870744d04b2','Daylit contemporary workspace with long shared tables'],
 ['1521737711867-e3b97375f902','People collaborating around a work table'],
 ['1497366754035-f200968a6e72','Organized office interior with shared workspaces'],
 ['1497366216548-37526070297c','Office workspace illustrating administrative organization'],
 ['1454165804606-c3d57bc86b40','Business documents being reviewed at a table'],
 ['1486406146926-c627a92ad1ab','Commercial building facade viewed from street level'],
 ['1460925895917-afdab827c52f','Computer displaying business information and charts'],
 ['1504384308090-c894fdcc538d','Collaborative work setting illustrating organizational management'],
 ['1503387762-592deb58ef4e','Plans and technical documents arranged for review'],
 ['1560518883-ce09059eeffa','House keys illustrating residential property management'],
 ['1449158743715-0a90ebb6d2d8','Contemporary building exterior and architectural details'],
 ['1480714378408-67cf0d13bc1b','New York city skyline and surrounding buildings'],
];
const section=(heading)=>({kind:'statement',eyebrow:'Unique Management Group',heading,body:'Management and consulting for business, operations, and property.',image:0,reverse:false});
export function generateUniqueManagement(job){
 if(job.customerSlug!==slug||job.business!=='Unique Management Group LLC'||!job.requestedChanges.includes('preserve-official-brand-v1'))throw Error('SCOPE_REJECTED');
 return {contract:'umg-reviewed-1',provider:{name:'openai',model:'gpt-6-astra'}};
}
export async function writeUniqueManagement(root,job){
 if(job.customerSlug!==slug||job.brief.customerSlug!==slug)throw Error('SCOPE_REJECTED');
 const manifest=customerManifestSchema.parse(JSON.parse(await readFile(path.join(root,'customers/manifest.json'),'utf8')));
 if(manifest.customers.some(c=>c.slug===slug))throw Error('SCOPE_REJECTED');
 for(const p of ['customers','public','public/customers'])if((await lstat(path.join(root,p))).isSymbolicLink())throw Error('SCOPE_REJECTED');
 for(const p of [`customers/${slug}`,`public/customers/${slug}`]){try{await lstat(path.join(root,p));throw Error('SCOPE_REJECTED');}catch(e){if(e.code!=='ENOENT')throw e;}}
 const base=JSON.parse(await readFile(path.join(root,'templates/customer-package/site/customer.config.json'),'utf8'));
 const source='https://uniquemanagementgroup.com/services/';
 const fact=value=>({value,status:'verified',source:'CUSTOMER PROVIDED — explicit September 29, 2026 redesign instruction'});
 Object.assign(base,{slug,status:'review',templateId:'ledger',business:{name:job.business,industry:'Management and consulting',tagline:'Complexity, managed.',summary:'Management and consulting for business operations, organizational direction, and real estate.'},contact:{person:fact('AMINUL HAQUE'),phone:fact('347-666-3929'),email:fact('info@uniquemanagementgroup.com'),address:fact('2505 AQUEDUCT AVE\nSTE 5E\nBRONX, NY 10458'),serviceAreas:{value:'',status:'missing'}},services:services.map(([name,description])=>({name,description,status:'verified',source:'CURRENT OFFICIAL WEBSITE — '+source+'; scope subject to customer review'})),branding:{primary:'#00378c',secondary:'#102443',accent:'#2b6cf5',surface:'#fafbf9',logoPath:`/customers/${slug}/logo.svg`,faviconPath:`/customers/${slug}/favicon.svg`}});
 base.design={version:'2.0',hero:'editorial',navigation:'balanced',typography:'modern',spacing:'compact',palette:'ink',logo:'interlock',pages:{home:Array.from({length:5},()=>section('Complexity, managed.')),services:[section('Management and consulting'),section('Seven connected services')],about:[section('Structure. Clarity. Execution.'),section('Our purpose')],contact:[section('A conversation. A clearer path.')],privacy:[section('Privacy preview notice')]},imageDirection:'Licensed illustrative offices, collaboration, planning, commercial buildings and New York. Never presented as actual customer projects or personnel.',brandNotes:'Preserve the official blue vector logo unchanged. Palette: official navy #00378c, electric blue #2b6cf5, sky #beebfc. Original green #24c848 documented but not used for small-text UI. Custom editorial layout with crisp rules, deliberate imagery and accessible contrast. No new logo identity.'};
 base.pages={home:{eyebrow:'Business. People. Property.',headline:'Complexity, managed.',intro:'Management and consulting for businesses and property owners ready to move forward.',ctaLabel:'Discuss your needs'},services:{headline:'Better structure. Greater clarity.',intro:'Seven complementary management and consulting services.'},about:{headline:'Structure. Clarity. Execution.',paragraphs:['Our mission is to simplify complex operations through management and consulting.']},contact:{headline:'A conversation. A clearer path.',intro:'Connect with Aminul Haque to discuss your management and consulting needs.'},privacy:{headline:'Clear about your information.',body:['Preview form inactive. Direct phone and email links use your chosen application.','Hosting infrastructure may process technical information. Final privacy arrangements require review.']}};
 base.form={provider:'sendgrid',mode:'disabled',recipientConfirmed:false,testPassed:false};
 base.myndy={agentName:'Unique Management Guide',greeting:'Please contact the business directly.',avatarBrief:'Existing brand identity only.',knowledgeContextPath:`customers/${slug}/myndy/agent-context.md`,embed:{enabled:false,agentId:'',scriptUrl:''}};
 base.seo={title:'Unique Management Group LLC | Management & Consulting',description:'Business, administrative and real estate management, with organizational, records and location consulting. Contact Unique Management Group LLC in the Bronx.'};
 base.schema={type:'Organization',description:base.business.summary};
 const files=new Map(),inventory=[],images=[];
 for(const [i,[id,alt]] of photos.entries()){
  const source=`https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1800&q=85`;const r=await fetch(source,{redirect:'error',signal:AbortSignal.timeout(40000)});if(!r.ok||!r.headers.get('content-type')?.startsWith('image/'))throw Error('INVALID_OUTPUT');
  const input=Buffer.from(await r.arrayBuffer());const {data,info}=await sharp(input,{limitInputPixels:40000000}).rotate().resize({width:i===0?1600:1200,height:1600,fit:'inside',withoutEnlargement:true}).webp({quality:80}).toBuffer({resolveWithObject:true});
  const file=`public/customers/${slug}/images/image-${i}.webp`;files.set(file,data);images.push({src:'/'+file.slice(7),alt:alt+'; illustrative, not a company project or team',width:info.width,height:info.height});inventory.push({file,source,provenance:'licensed',license:'https://unsplash.com/license',description:alt,sha256:createHash('sha256').update(data).digest('hex'),bytes:data.length,width:info.width,height:info.height});
 }
 const logoSource='https://uniquemanagementgroup.com/wp-content/uploads/2025/10/Unique-Management-Group-Logo.svg';const r=await fetch(logoSource);if(!r.ok)throw Error('INVALID_OUTPUT');const logo=await r.text();
 if(/<script|<foreignObject|onload=|href=["']https?:/i.test(logo)||!logo.includes('#00378c'))throw Error('INVALID_OUTPUT');
 if(createHash('sha256').update(logo).digest('hex')!==job.requestedChanges.match(/logo-sha256:([a-f0-9]{64})/)?.[1])throw Error('INPUT_CHANGED');
 files.set(`public/customers/${slug}/logo.svg`,logo);files.set(`public/customers/${slug}/logo-dark.svg`,logo);
 const compact=logo.replace('viewBox="0 0 165 48.75"','viewBox="0 3 35 40"').replace('width="220"','width="64"').replace('height="65"','height="64"');
 files.set(`public/customers/${slug}/favicon.svg`,compact);files.set(`public/customers/${slug}/mark.svg`,compact);
 inventory.push({file:`public/customers/${slug}/logo.svg`,source:logoSource,provenance:'customer-owned official website identity; retention explicitly requested',sha256:createHash('sha256').update(logo).digest('hex'),cleanup:'None. Original vector byte-for-byte. Compact variants change viewport only; logo-dark is the original on a white placard.'});
 base.images={hero:images[0],gallery:images.slice(1)};const site=customerSiteSchema.parse(base);
 files.set(`customers/${slug}/site/customer.config.json`,JSON.stringify(site,null,2)+'\n');
 files.set(`customers/${slug}/myndy/agent-context.md`,'INACTIVE. Unique Management Group LLC only. No customer lead recipient, assistant, payment or email configuration is active. Use only the seven official-site services and customer-provided contact facts. Never infer hours, licenses, service areas or outcomes.');
 files.set(`customers/${slug}/delivery/brand-notes.md`,base.design.brandNotes+'\nExisting logo preserved byte-for-byte; favicon crops the existing icon without changing geometry. Footer uses an unmodified blue logo on white. Brand expansion: ink #102443, muted #4c5d74, background #fafbf9, surface #eaf4fa, border #d1dbe7, interaction #00245c.');
 files.set(`customers/${slug}/delivery/image-inventory.json`,JSON.stringify(inventory,null,2));
 files.set(`customers/${slug}/delivery/research.md`,await readFile(new URL('./unique-management-research.md',import.meta.url),'utf8'));
 files.set(`customers/${slug}/delivery/missing-information.md`,'Confirm service scope and service area, walk-in/address usage and hours, privacy arrangements, testimonial authenticity/permission, optional logo typography alignment and imagery approval. No EIN supplied or published. No verified lead recipient. No launch or customer approval.');
 files.set(`customers/${slug}/delivery/outreach.md`,'UNSENT. No communication sent. Customer review package: five pages, preserved official blue logo, seven official-site services, disabled inquiry form. Customer preview URL is valid only after worker and branded-route verification.');
 manifest.customers.push(site);customerManifestSchema.parse(manifest);files.set('customers/manifest.json',JSON.stringify(manifest,null,2)+'\n');
 for(const [file,content] of files){await mkdir(path.dirname(path.join(root,file)),{recursive:true});await writeFile(path.join(root,file),content,{flag:file==='customers/manifest.json'?'w':'wx'});}return site;
}
