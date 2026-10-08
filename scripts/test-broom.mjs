import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import http from 'node:http';
import ts from 'typescript';

const slug = 'broom-home-enterprises-llc';
const manifest = JSON.parse(readFileSync('customers/manifest.json', 'utf8'));
const site = manifest.customers.find(site => site.slug === slug);
assert(site);
assert.equal(manifest.customers.filter(site => site.slug === slug).length, 1);
assert.deepEqual(site, JSON.parse(readFileSync(`customers/${slug}/site/customer.config.json`, 'utf8')));
const baseline = JSON.parse(execFileSync('git', ['show', '287f9b1:customers/manifest.json'], { encoding: 'utf8' }));
assert.deepEqual(manifest.customers.filter(site => site.slug !== slug), baseline.customers, 'Existing customers must be unchanged');
assert.deepEqual(site.form, { provider: 'sendgrid', mode: 'disabled', recipientConfirmed: false, testPassed: false });
assert.equal(site.myndy.embed.enabled, false);
assert.equal(site.myndy.embed.agentId, '');
assert(existsSync(site.myndy.knowledgeContextPath));
for (const asset of [site.branding.logoPath, site.branding.faviconPath, site.images.hero.src, ...site.images.gallery.map(image => image.src)]) {
  assert(asset.startsWith(`/customers/${slug}/`));
  assert(existsSync('public' + asset), asset);
}
assert.equal(site.schema.type, 'Organization');
assert.equal(site.contact.address.status, 'missing');
const code = ts.transpileModule(readFileSync('lib/customers/broom-content.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const testModule = { exports: {} };
new Function('exports', code)(testModule.exports);
const { validBroomRoute, broomServices } = testModule.exports;
for (const route of [[], ['services'], ['about'], ['contact'], ['faq'], ['privacy'], ...broomServices.map(s => ['services', s.slug])]) assert(validBroomRoute(route));
for (const route of [['home'], ['services', 'fake-listing'], ['contact', 'extra'], ['faq', 'extra'], ['services', 'buying', 'extra'], ['thank-you']]) assert(!validBroomRoute(route));
console.log('PASS: exact tenant registration, existing tenant preservation, all 11 routes, invalid route rejection, asset ownership, inactive email/chat, no fictitious structured-data address.');

if (process.env.BROOM_QA_ORIGIN) {
  const base = process.env.BROOM_QA_ORIGIN;
  for (const route of ['', '/services', '/about', '/contact', '/faq', '/privacy', ...broomServices.map(s => '/services/' + s.slug)]) {
    const r = await fetch(base + '/' + slug + route);
    assert.equal(r.status, 200, route);
    const alias=await fetch(base+'/broom-home-enterprises'+route,{redirect:'manual'});
    assert.equal(alias.status,308,route+' alias');
    assert.equal(new URL(alias.headers.get('location'),base).pathname,'/'+slug+route);
    const html = await r.text();
    assert(html.includes(`data-customer-slug="${slug}"`));
    assert(html.includes(`rel="canonical" href="https://preview.redspectrum.ai/${slug}${route}"`));
    assert.match(html, /name="robots" content="noindex, nofollow"/);
    assert(!html.includes('<myndy-convai'));
    assert(!html.includes('<script src="https://widget.myndy.ai'));
    assert(!html.includes('6417efec-04c9-497c-a735-229d51219944'));
  }
  const invalid = await fetch(base + '/' + slug + '/services/not-a-service');
  assert.equal(invalid.status, 404);
  const form = new FormData();
  for (const [key, value] of Object.entries({ name: 'Synthetic QA', email: 'qa@example.invalid', phone: '5555550100', service: 'Buying', message: 'Synthetic inactive delivery check.', consent: 'on' })) form.set(key, value);
  const r = await fetch(base + '/api/leads/' + slug, { method: 'POST', body: form, headers: { origin: base } });
  assert.equal(r.status, 503);
  assert.equal((await r.json()).message, 'Form delivery is not active.');
  for (const customer of baseline.customers) {
    const result = base.startsWith('http://localhost:')
      ? await new Promise((resolve, reject) => http.get(base + '/' + customer.slug, { headers: { host: 'red-spectrum-website-factory.vercel.app' } }, response => {
        let html = ''; response.on('data', data => { html += data; });
        response.on('end', () => resolve({ status: response.statusCode, html }));
      }).on('error', reject))
      : await fetch(base + '/' + customer.slug).then(async response => ({ status: response.status, html: await response.text() }));
    assert.equal(result.status, 200, customer.slug);
    assert(!result.html.includes(`data-customer-slug="${slug}"`), customer.slug);
  }
  console.log('PASS: live routes, noindex, public request privacy, 404, inactive API response and all seven existing customer homepages. No delivery/storage occurs for a disabled tenant.');
}
