import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import ts from 'typescript';
import pg from 'pg';
const require = createRequire(import.meta.url);
const load = (file, deps = {}) => {
  const m = { exports: {} };
  const code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function('require', 'module', 'exports', code)(name => {
    if (name === 'server-only') return {};
    if (name in deps) return deps[name];
    if (['zod', 'node:crypto'].includes(name)) return require(name);
    throw Error('Unexpected dependency ' + name);
  }, m, m.exports); return m.exports;
};
const manifest = JSON.parse(readFileSync('customers/manifest.json', 'utf8'));
const registry = { getCustomerSite: slug => manifest.customers.find(s => s.slug === slug) };
const config = load('lib/leads/config.ts'), validation = load('lib/leads/validation.ts'), email = load('lib/leads/email.ts');
const site = registry.getCustomerSite('unique-management-group');
assert.equal(config.getCustomerDelivery(site, 'live').recipient, 'info@uniquemanagementgroup.com');
assert.equal(config.getCustomerDelivery(registry.getCustomerSite('unique-home-enterprise'), 'live').recipient, 'contact@uniquehomeenterprise.com');
assert.equal(site.myndy.embed.enabled, false);
const schema = 'umg_qa_' + randomUUID().replaceAll('-', '');
const db = new pg.Pool({ connectionString: process.env.LEADS_DATABASE_URL });
const scoped = { query: (sql, args) => db.query(sql.replace(/\bwebsite_lead_rate_limits\b/g, schema + '.website_lead_rate_limits').replace(/\bwebsite_leads\b/g, schema + '.website_leads'), args) };
const oldFetch = globalThis.fetch;
globalThis.fetch = async () => { throw Error('Outbound network blocked'); };
let sends = 0, status = 202, lastPayload;
try {
  await db.query('CREATE SCHEMA ' + schema);
  await db.query(`CREATE TABLE ${schema}.website_leads (LIKE public.website_leads INCLUDING ALL)`);
  await db.query(`CREATE TABLE ${schema}.website_lead_rate_limits (LIKE public.website_lead_rate_limits INCLUDING ALL)`);
  class ScopedPool { query(...args) { return scoped.query(...args); } }
  const store = load('lib/leads/store.ts', { pg: { Pool: ScopedPool } });
  const myndy = { myndyContactSyncConfigured: slug => { assert.equal(slug, site.slug); return false; }, syncUniqueHomeContact: () => { throw Error('UMG must never sync to Myndy'); }, safeMyndyError: () => 'blocked' };
  const service = load('lib/leads/service.ts', { './config': config, './email': email, './store': store, './validation': validation, './myndy-contacts': myndy, '@/lib/customers/registry': registry });
  const route = load('app/api/leads/[customerSlug]/route.ts', { '@/lib/customers/registry': registry, '@/lib/leads/service': service, '@/lib/leads/validation': validation, '@/lib/customers/domains': load('lib/customers/domains.ts') });
  process.env.WEBFACTORY_CUSTOMER_EMAILS_ENABLED = 'true';
  process.env.WEBFACTORY_UMG_CONTACT_ENABLED = 'true';
  process.env.WEBFACTORY_LEAD_LIVE_ACTIVE_SLUGS = site.slug;
  const base = { name: 'Synthetic UMG QA', email: 'qa@example.invalid', phone: '202-555-0123', company: 'Synthetic organization', service: 'Business Management', message: 'Synthetic inquiry <script>test</script>', consent: 'on', botcheck: '' };
  async function submit(extra = {}, origin = 'https://preview.redspectrum.ai') {
    const f = new FormData(); for (const [k, v] of Object.entries({ ...base, ...extra })) if (v !== undefined) f.set(k, v);
    const r = await route.POST(new Request('https://preview.redspectrum.ai/api/leads/' + site.slug, { method: 'POST', headers: { origin, 'x-forwarded-for': randomUUID() }, body: f }), { params: Promise.resolve({ customerSlug: site.slug }) });
    return { status: r.status, body: await r.json() };
  }
  globalThis.fetch = async (url, options) => {
    assert.equal(url, 'https://api.sendgrid.com/v3/mail/send');
    lastPayload = JSON.parse(options.body); sends++;
    assert.deepEqual(lastPayload.personalizations[0].to, [{ email: 'info@uniquemanagementgroup.com' }]);
    assert.equal(lastPayload.reply_to.email, base.email);
    return new Response(null, { status, headers: { 'x-message-id': 'mock-accepted' } });
  };
  for (const invalid of [{ email: 'bad' }, { name: '' }, { phone: '' }, { message: '' }, { consent: undefined }, { recipient: 'other@example.com' }, { service: 'Unknown service' }, { botcheck: 'spam' }]) assert.equal((await submit(invalid)).status, 400);
  assert.equal((await submit({}, 'https://uniquehomeenterprise.com')).status, 403);
  const good = await submit(); assert.equal(good.status, 200); assert.equal(good.body.ok, true);
  const saved = (await scoped.query('SELECT * FROM website_leads WHERE lead_id=$1', [good.body.leadId])).rows[0];
  assert.equal(saved.notification_status, 'accepted'); assert.equal(saved.recipient_email, 'info@uniquemanagementgroup.com');
  assert.match(saved.message, /Company: Synthetic organization/); assert.equal(saved.myndy_sync_status, null);
  assert.match(lastPayload.content[1].value, /&lt;script&gt;/);
  assert.equal((await submit()).body.duplicate, true); assert.equal(sends, 1);
  status = 500;
  const failed = await submit({ message: 'Synthetic notification failure' }); assert.equal(failed.status, 503); assert.equal(failed.body.saved, true);
  assert.equal((await scoped.query('SELECT notification_status FROM website_leads WHERE lead_id=$1', [failed.body.leadId])).rows[0].notification_status, 'failed');
  const before = sends; await submit({ message: 'Synthetic notification failure' }); assert.equal(sends, before);
  assert.deepEqual((await scoped.query('SELECT DISTINCT customer_slug FROM website_leads')).rows, [{ customer_slug: site.slug }]);
  console.log('PASS: UMG validation, consent, PostgreSQL save, company capture, Reply-To, exact recipient isolation, duplicate suppression, safe email failure, and no Myndy. ZERO real emails.');
} finally {
  globalThis.fetch = oldFetch;
  await db.query('DROP SCHEMA IF EXISTS ' + schema + ' CASCADE');
  await db.end();
}
