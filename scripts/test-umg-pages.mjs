import { execFileSync } from 'node:child_process';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import assert from 'node:assert/strict';
const env = parseEnv(readFileSync('../../.env.worker.local', 'utf8'));
const cli = env.AGENT_BROWSER_CLI;
const base = process.env.UMG_QA_ORIGIN || 'http://localhost:3217';
const root = '/unique-management-group';
const dir = 'customers/unique-management-group/qa/delivery';
mkdirSync(dir, { recursive: true });
const browser = (...args) => execFileSync(process.execPath, [cli, '--session', 'umg-delivery', ...args], { encoding: 'utf8', timeout: 90000 });
const evaluate = script => JSON.parse(execFileSync(process.execPath, [cli, '--session', 'umg-delivery', 'eval', '--stdin'], { input: script, encoding: 'utf8', timeout: 90000 }));
const services = JSON.parse(readFileSync('customers/unique-management-group/site/customer.config.json', 'utf8')).services.map(s => s.name.toLowerCase().replaceAll(' ', '-'));
const paths = ['', '/services', ...services.map(s => '/services/' + s), '/about', '/contact', '/privacy', '/thank-you'];
const axe = await (await fetch('https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.3/axe.min.js')).text();
const results = [];
for (const path of paths) {
  browser('open', base + root + path);
  assert.equal(evaluate(`(async()=>{const images=[...document.images];images.forEach(i=>i.loading='eager');await Promise.all(images.map(i=>i.decode().catch(()=>{})));return images.every(i=>i.naturalWidth>0);})()`), true, path + ' images');
  evaluate(axe + ';true');
  for (const width of [320, 375, 768, 1024, 1440, 1920]) {
    browser('set', 'viewport', String(width), '1000');
    const result = evaluate(String.raw`(async()=>{await document.fonts.ready;const a=await axe.run(document.querySelector('.umg'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});return {width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,h1:document.querySelectorAll('h1').length,main:!!document.querySelector('main'),alt:[...document.images].every(i=>!!i.alt),labels:[...document.querySelectorAll('input,textarea,select')].every(i=>i.labels.length>0),bad:/PRIVATE DESIGN PREVIEW|placeholder|internal review|verification|hostingersite|profits increased|35%|Urbanbit|BeTheme|WordPress|\+61|preview form|draft/i.test(document.querySelector('.umg').innerText),myndy:document.querySelectorAll('myndy-convai,script[src*="myndy"]').length,violations:a.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),description:!!document.querySelector('meta[name="description"]'),og:!!document.querySelector('meta[property="og:image"]')};})()`);
    results.push({ path, ...result });
    writeFileSync(dir + '/page-qa.json', JSON.stringify({ origin: base, results }, null, 2));
    assert.equal(result.overflow, false, path + ' overflow ' + width);
    assert.equal(result.h1, 1, path + ' h1'); assert.equal(result.main, true);
    assert.equal(result.alt && result.labels && result.description && result.og, true, path + ' semantics');
    assert.equal(result.bad, false, path + ' legacy content'); assert.equal(result.myndy, 0);
    assert.deepEqual(result.violations, [], path + ' accessibility ' + width);
    if (['', '/services', '/contact'].includes(path) && [320, 1440].includes(width)) browser('screenshot', dir + '/' + (path.slice(1) || 'home') + '-' + width + '.png', '--full');
  }
  console.log('PASS: ' + (path || '/') + ' — six widths, accessibility, metadata, no legacy content, no Myndy.');
}
browser('open', base + root + '/contact');
evaluate(`(()=>{window.fetch=async()=>new Response(JSON.stringify({ok:false}),{status:503});const f=document.querySelector('form');const v={name:'Synthetic Browser QA',email:'qa@example.com',phone:'202-555-0123',company:'Synthetic',service:'Business Management',message:'Synthetic browser test, never sent'};for(const[k,x]of Object.entries(v))f.elements.namedItem(k).value=x;f.elements.namedItem('consent').checked=true;f.requestSubmit();return true;})()`);
assert.equal(evaluate(`document.querySelector('[role="alert"]')!==null && document.querySelector('[name="name"]').value==='Synthetic Browser QA' && location.pathname.endsWith('/contact')`), true);
evaluate(`(()=>{window.fetch=async()=>new Response(JSON.stringify({ok:true}),{status:200});document.querySelector('form').requestSubmit();return true;})()`);
browser('wait', 'h1');
assert.equal(browser('get', 'url').trim(), base + root + '/thank-you');
console.log('PASS: mocked browser error preserves inputs; success redirects to branded thank-you. No real submissions.');
browser('close');
