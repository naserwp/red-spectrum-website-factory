import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

function load(file, dependencies = {}) {
  const testModule = { exports: {} };
  const compiled = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function('require', 'module', 'exports', compiled)(name => {
    assert(name in dependencies, name);
    return dependencies[name];
  }, testModule, testModule.exports);
  return testModule.exports;
}
const content = load('lib/customers/broom-content.ts');
const domains = load('lib/customers/domains.ts');
const { broomSeo, broomLocation } = load('lib/customers/broom-seo.ts', { './broom-content': content, './domains': domains });
const routes = [[], ['services'], ['about'], ['contact'], ['faq'], ['privacy'], ...content.broomServices.map(service => ['services', service.slug])];
const metadata = routes.map(broomSeo);
assert.equal(new Set(metadata.map(page => page.title)).size, 11);
assert.equal(new Set(metadata.map(page => page.description)).size, 11);
for (const page of metadata) assert(page.title && page.description.length > 60);
for (const host of ['preview.redspectrum.ai', 'localhost:3232', 'evil.invalid', 'uniquehomeenterprise.com']) {
  assert.deepEqual(broomLocation(host), { root: '/' + content.broomSlug, origin: 'https://preview.redspectrum.ai', production: false });
}
// Prepared hosts do not change admin launch state.
assert.equal(domains.canonicalCustomerUrl(content.broomSlug), null);
assert.deepEqual(broomLocation('broomhome.biz'), { root: '', origin: 'https://www.broomhome.biz', production: true });
domains.customerDomains['www.broomhome.biz'] = { slug: content.broomSlug, canonicalHost: 'www.broomhome.biz', status: 'attached' };
assert.equal(broomLocation('www.broomhome.biz').production, false);
domains.customerDomains['www.broomhome.biz'].status = 'verified';
assert.deepEqual(broomLocation('www.broomhome.biz'), { root: '', origin: 'https://www.broomhome.biz', production: true });
assert.equal(broomLocation('preview.redspectrum.ai').production, false);
console.log('PASS: 11 unique titles/descriptions; unknown, preview and other-tenant hosts stay noindex; only an explicitly verified Broom domain selects production URLs.');

