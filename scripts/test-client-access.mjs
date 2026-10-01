import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const load = (file, deps = {}) => { const testModule = { exports: {} }; const code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText; new Function('require', 'module', 'exports', code)(name => deps[name] ?? {}, testModule, testModule.exports); return testModule.exports; };
const mapper = load('lib/webfactory/project-status.ts');
const id = '11111111-2222-4333-8444-555555555555';
const key = 'a'.repeat(64), hash = createHash('sha256').update(key).digest('hex');
let token = `${id}.${key}`, queries = [];
const row = { id, business: 'Owned project', access_hash: hash, status: 'received', customer_slug: null, created_at: new Date(), updated_at: new Date(), stage: null, preview_url: null, brief_status: null, build_status: null, review_status: null };
const database = () => ({ query: async (sql, params) => { queries.push({ sql, params }); return { rows: sql.includes('access_hash') ? params[0] === id ? [row] : [] : sql.includes('WHERE r.id=$1') ? params[0] === id ? [row] : [] : [row] }; } });
let admin = false;
const project = load('lib/webfactory/project-data.ts', {
  'next/headers': { cookies: async () => ({ get: () => token ? { value: token } : undefined }) },
  'next/navigation': { redirect: path => { throw Object.assign(Error(`redirect ${path}`), { digest: 'NEXT_REDIRECT' }); } },
  './server': { database, digest: value => createHash('sha256').update(value).digest('hex'), secureEqual: (a, b) => a === b, isAdmin: async () => admin },
  './project-status': mapper,
});
assert.equal(project.parseRequestAccessToken(token)?.id, id);
assert.equal(project.parseRequestAccessToken(`${token}.extra`), null);
assert.equal((await project.currentCustomerSession())?.requestId, id);
assert.equal((await project.getCustomerProjects())[0].title, 'Owned project');
assert.ok(queries.some(query => query.sql.includes('WHERE r.id=$1 AND r.access_hash=$2') && query.params[1] === hash));
assert.equal(await project.getCustomerProject('another-customer'), null);
assert.ok(!queries.some(query => query.params?.[0] === 'another-customer'));
token = `${id}.${'b'.repeat(64)}`;
assert.equal(await project.currentCustomerSession(), null);
await assert.rejects(() => project.getCustomerProjects(), /redirect \/client\/login/);
token = '';
await assert.rejects(() => project.getAdminProjects(), /redirect \/admin\/login/);
admin = true;
assert.equal((await project.getAdminProjects())[0].id, id);
console.log('PASS: bound request cookie, invalid token, cross-project denial, customer-safe mapping, admin gate');
