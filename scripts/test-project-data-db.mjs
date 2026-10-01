import assert from 'node:assert/strict';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const load = (file, deps) => { const testModule = { exports: {} }; const code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText; new Function('require', 'module', 'exports', code)(name => deps[name] ?? require(name), testModule, testModule.exports); return testModule.exports; };
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.LEADS_DATABASE_URL, connectionTimeoutMillis: 5000 });
const connection = await pool.connect();
const id = randomUUID(), submissionId = randomUUID(), key = randomBytes(32).toString('hex');
const digest = value => createHash('sha256').update(value).digest('hex');
try {
  await connection.query('BEGIN');
  await connection.query("INSERT INTO webfactory.requests(id,submission_id,access_hash,name,business,email,phone,industry,website,details) VALUES($1,$2,$3,'Synthetic','Synthetic request','synthetic@example.invalid','','Test','','Local fixture only')", [id, submissionId, digest(key)]);
  const mapper = load('lib/webfactory/project-status.ts', {});
  let admin = false;
  const data = load('lib/webfactory/project-data.ts', {
    'server-only': {},
    'next/headers': { cookies: async () => ({ get: name => name === 'wf_request' ? { value: `${id}.${key}` } : undefined }) },
    'next/navigation': { redirect: path => { throw Error(`redirect ${path}`); } },
    './server': { database: () => connection, digest, secureEqual: (a, b) => a === b, isAdmin: async () => admin },
    './project-status': mapper,
  });
  const customer = (await data.getCustomerProjects())[0];
  assert.equal(customer.title, 'Synthetic request');
  assert.equal(customer.stage, 'request');
  assert.equal(customer.previewHref, null);
  assert.equal(await data.getCustomerProject('different'), null);
  admin = true;
  const adminProject = (await data.getAdminProjects()).find(project => project.id === id);
  assert.equal(adminProject.title, customer.title);
  assert.equal(adminProject.briefStatus, 'pending');
  console.log('PASS: isolated PostgreSQL project query, bound customer access, real admin query, safe DTO');
} finally {
  await connection.query('ROLLBACK').catch(() => {});
  connection.release();
  await pool.end();
}
