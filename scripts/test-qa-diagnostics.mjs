import assert from 'node:assert/strict';
import vm from 'node:vm';
import {settleImages} from './build-worker/image-readiness.mjs';
import {recorder,checkHtml,checkBrowser,browserStep,QaFailure,safeResults} from './build-worker/qa.mjs';
const job={customerSlug:'synthetic',requestId:'private-request',briefId:'private-brief'},site={business:{name:'Synthetic'}};
const html='<title>Preview</title><meta content="noindex"><script type="application/ld+json">'+JSON.stringify({name:'Synthetic',url:'https://preview.redspectrum.ai/synthetic'})+'</script>';
function fails(name,fn){let caught;try{fn();}catch(e){caught=e;}assert(caught instanceof QaFailure);assert.equal(caught.results.at(-1).check_name,name);assert.equal(caught.results.at(-1).status,'failed');assert(!JSON.stringify(safeResults(caught.results)).includes('private-request'));}
fails('customer-route',()=>checkHtml(recorder(),html,404,job,site,''));
fails('customer-identity',()=>checkHtml(recorder(),html.replace('Synthetic','Other'),200,job,site,''));
fails('privacy',()=>checkHtml(recorder(),html+'private-request',200,job,site,''));
fails('metadata',()=>checkHtml(recorder(),html.replace('noindex','index'),200,job,site,''));
const good={overflow:false,images:true,leak:false,error:false};
fails('tenant-isolation',()=>checkBrowser(recorder(),{...good,leak:true},'',320));
fails('mobile-overflow',()=>checkBrowser(recorder(),{...good,overflow:true},'/contact',320));
for(const [code,name] of [[undefined,'browser-launch'],['COMMAND_TIMEOUT','browser-timeout']]){
 await assert.rejects(()=>browserStep(recorder(),()=>Promise.reject(Object.assign(Error('secret-token-and-raw-stack'),{code})),'',320,'browser-launch'),e=>e instanceof QaFailure&&e.results.at(-1).check_name===name&&!JSON.stringify(e.results).includes('secret-token'));
}
const r=recorder();checkHtml(r,html,200,job,site,'');checkBrowser(r,good,'',320);assert(r.results.every(r=>r.status==='passed'));
console.log('PASS: route, identity, metadata, privacy, tenant isolation, overflow, browser failure and timeout diagnostics; raw exceptions never persisted.');
const image={loading:'lazy',complete:false,naturalWidth:0,src:'http://localhost/customers/synthetic/images/image-0.webp',decode:async()=>{}};
const context={document:{fonts:{ready:Promise.resolve()},documentElement:{scrollHeight:5000},images:[image]},innerHeight:700,location:{href:'http://localhost/synthetic'},requestAnimationFrame:f=>f(),scrollTo:(_x,y)=>{if(y>3500){image.complete=true;image.naturalWidth=800;}},setTimeout,URL,Promise,Date};
assert.equal((await vm.runInNewContext(`(${settleImages.toString()})()`,context)).failures.length,0);assert.equal(image.loading,'lazy');
image.naturalWidth=0;context.scrollTo=()=>{};
const broken=await vm.runInNewContext(`(${settleImages.toString()})()`,context);assert.equal(broken.failures[0].state,'broken');assert.equal(broken.failures[0].asset,'/customers/synthetic/images/image-0.webp');
console.log('PASS: scrolling triggers below-fold images without eager loading; broken-image diagnostics remain actionable.');
