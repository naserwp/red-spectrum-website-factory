import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { mtgServices, mtgPages, mtgBase } from '../lib/customers/mtg-content.ts';

// Test tooling is supplied outside the app; no customer runtime dependency is added.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || pathToFileURL('C:/Users/USER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs').href);
const base = process.env.MTG_QA_URL || 'http://localhost:3047';
const output = process.env.MTG_QA_OUTPUT || 'outputs/mtg-qa';
fs.mkdirSync(output, { recursive: true });
const routes = [...mtgPages, ...mtgServices.map(s => 'services/' + s.slug)];
const widths = [320, 375, 768, 1024, 1440];
const report = { base, date: new Date().toISOString(), layouts: [], metadata: [], links: [], interactions: [], failures: [], consoleErrors: [], screenshots: [] };
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.on('pageerror', error => report.consoleErrors.push(error.message));
  const internalLinks = new Set();
  const titles = new Set();
  for (const route of routes) {
    const url = `${base}${mtgBase}${route ? '/' + route : ''}`;
    await page.setViewportSize({ width: 1440, height: 1000 });
    const response = await page.goto(url, { waitUntil: 'networkidle' });
    assert.equal(response.status(), 200, route);
    await page.waitForSelector('[data-mtg-ready="true"]',{state:'attached'});
    await page.evaluate(async () => { await Promise.race([new Promise(resolve=>setTimeout(resolve,8000)), Promise.all([...document.images].map(image => { image.loading = 'eager'; return image.decode().catch(() => {}); }))]); });
    const meta = await page.evaluate(() => ({ title: document.title, description: document.querySelector('meta[name="description"]')?.content, robots: document.querySelector('meta[name="robots"]')?.content, canonical: document.querySelector('link[rel="canonical"]')?.href, og: document.querySelector('meta[property="og:image"]')?.content, h1: document.querySelectorAll('h1').length, schema: [...document.querySelectorAll('script[type="application/ld+json"]')].map(x => JSON.parse(x.textContent)), links: [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')), images: [...document.querySelectorAll('img')].map(i => ({ alt: i.alt, src: i.src })) }));
    assert.equal(meta.h1, 1, route + ' H1'); assert.ok(meta.description); assert.match(meta.robots, /noindex/); assert.equal(meta.canonical, 'https://preview.redspectrum.ai' + mtgBase + (route ? '/' + route : '')); assert.match(meta.og, /multi-trans-global-logistics\/social.png$/); assert.ok(!titles.has(meta.title), route + ' unique title'); titles.add(meta.title); assert.ok(meta.images.every(i => i.alt)); assert.ok(meta.schema.some(s => s['@graph']?.some(n => n.name === 'Multi Trans Global Logistics INC')));
    for (const link of meta.links) if (link.startsWith('/')) { assert.ok(link.startsWith(mtgBase), 'Tenant link: ' + link); internalLinks.add(link); }
    report.metadata.push({ route, title: meta.title, h1: meta.h1, robots: meta.robots, canonical: meta.canonical });
    for (const width of widths) {
      await page.setViewportSize({ width, height: 950 });
      const layout = await page.evaluate(() => ({ width: innerWidth, documentWidth: document.documentElement.scrollWidth, clippedHeadings: [...document.querySelectorAll('h1,h2,h3')].filter(el => el.scrollWidth > el.clientWidth + 2).map(el => el.textContent), brokenImages: [...document.images].filter(i => i.complete && !i.naturalWidth).map(i => i.src) }));
      const result = { route, ...layout }; report.layouts.push(result);
      if (layout.documentWidth > width + 1 || layout.clippedHeadings.length || layout.brokenImages.length) report.failures.push(result);
      if (['', 'services', 'services/dry-van-trucking', 'request-a-quote'].includes(route) && [375, 1440].includes(width)) { const filename = `${route.replaceAll('/', '-') || 'home'}-${width}.png`; await page.screenshot({ path: path.join(output, filename), fullPage: true }); report.screenshots.push(filename); }
    }
  }
  for (const href of internalLinks) { const r = await context.request.get(base + href); assert.equal(r.status(), 200, href); report.links.push({ href, status: r.status() }); }
  for (const route of ['/unknown', '/services/not-a-service', '/about/extra']) { const r = await context.request.get(base + mtgBase + route); assert.equal(r.status(), 404, route); }
  report.interactions.push('All internal tenant links return 200; invalid routes return 404.');
  await page.setViewportSize({ width: 375, height: 850 }); await page.goto(base + mtgBase);
  const menu = page.locator('button[aria-controls="mtg-navigation"]'); await menu.click(); assert.equal(await menu.getAttribute('aria-expanded'), 'true'); await page.keyboard.press('Escape'); assert.equal(await menu.getAttribute('aria-expanded'), 'false'); assert.ok(await menu.evaluate(el => el === document.activeElement)); await menu.click(); await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'About', exact: true }).click(); await page.waitForURL('**/about'); assert.equal(await page.locator('button[aria-controls="mtg-navigation"]').getAttribute('aria-expanded'), 'false');
  await page.locator('footer').getByRole('link', { name: 'Multi Trans Global Logistics home' }).click(); await page.waitForURL(base + mtgBase);
  report.interactions.push('Mobile menu open, Escape, focus return, navigation close and footer home link pass.');
  await page.goto(base + mtgBase + '/faq'); const detail = page.locator('details').first(); await detail.locator('summary').click(); assert.ok(await detail.getAttribute('open') !== null); await detail.locator('summary').click(); assert.equal(await detail.getAttribute('open'), null); report.interactions.push('Native FAQ expands and collapses.');
  await page.goto(base + mtgBase + '/request-a-quote'); const posts=[]; page.on('request', r => { if(r.method()==='POST') posts.push(r.url()); });
  await page.locator('.mtg-summary-option summary').click(); const planner=page.locator('.mtg-summary-option');
  await planner.getByRole('button', { name: /Prepare inquiry/ }).click(); assert.equal(await planner.getByRole('region', { name: 'Prepared inquiry' }).count(), 0);
  await planner.getByLabel('Contact name *', { exact: true }).fill('QA Test'); await planner.getByLabel('Email *', { exact: true }).fill('qa@example.invalid'); await planner.getByLabel('Pickup city / state / ZIP *', { exact: true }).fill('Chicago IL'); await planner.getByLabel('Delivery city / state / ZIP *', { exact: true }).fill('Test destination'); await planner.getByLabel('Shipment details *', { exact: true }).fill('QA only — do not send. Four pallets of packaged dry goods.'); await planner.getByRole('button', { name: /Prepare inquiry/ }).click();
  assert.match(await planner.getByLabel('Freight inquiry summary', { exact: true }).inputValue(), /QA Test/); assert.match(await planner.getByRole('link', { name: /Open email app/ }).getAttribute('href'), /^mailto:mtglobal39@gmail.com\?subject=/); assert.equal(posts.length, 0); await planner.getByLabel('Shipment details *', { exact: true }).fill('Changed'); assert.equal(await planner.getByRole('region', { name: 'Prepared inquiry' }).count(), 0);
  report.interactions.push('Required-field validation, summary, correct mailto recipient, invalidation after edits and zero planner POST pass; no email sent.');
  await page.setViewportSize({ width: 720, height: 1000 }); await page.goto(base + mtgBase); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)); report.interactions.push('Homepage 720px reflow has no horizontal overflow; native browser zoom not measured.');
  const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 1000 } }); const staticPage = await noJs.newPage(); await staticPage.goto(base+mtgBase); assert.equal(await staticPage.locator('h1').count(),1); await staticPage.getByRole('link',{name:'Explore our services',exact:true}).click(); await staticPage.waitForURL('**/services'); report.interactions.push('Desktop content and native service navigation work without JavaScript.'); await noJs.close();
  // Existing customers are checked only for route availability; nothing is submitted.
  for(const slug of ['broom-home-enterprises-llc','swenzy-logistics','jm-trucking','360-vitality-fitness','unique-management-group']) {const r=await context.request.get(base+'/'+slug, { headers: base.includes('localhost') ? { host: 'preview.redspectrum.ai' } : {} }); report.links.push({href:'/'+slug,status:r.status()}); assert.equal(r.status(),200,slug);}
  assert.equal(report.consoleErrors.length,0,JSON.stringify(report.consoleErrors)); assert.equal(report.failures.length,0,JSON.stringify(report.failures));
  report.passed = true;
} catch(error) {report.passed=false;report.error=error.stack;throw error;} finally {fs.writeFileSync(path.join(output,'verification.json'),JSON.stringify(report,null,2)+'\n');await Promise.race([browser.close(),new Promise(r=>setTimeout(r,5000))]);console.log(JSON.stringify({passed:report.passed,layouts:report.layouts.length,pages:report.metadata.length,links:report.links.length,failures:report.failures,error:report.error}));}
