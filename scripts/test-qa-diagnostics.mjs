import assert from 'node:assert/strict';
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
