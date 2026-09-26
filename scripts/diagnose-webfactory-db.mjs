import { readFile } from 'node:fs/promises';
import { lookup } from 'node:dns/promises';
import { parseEnv } from 'node:util';
import pg from 'pg';

// Never log connection strings, credentials, or raw driver errors.
const safeCodes = new Set(['ENOTFOUND', 'EAI_AGAIN', 'ECONNREFUSED', 'ETIMEDOUT', '28P01', '3D000', '42501']);
let client;
let stage = 'configuration';
try {
  const file = await readFile(new URL('../.env.local', import.meta.url), 'utf8');
  const parsed = parseEnv(file).LEADS_DATABASE_URL;
  const value = process.env.LEADS_DATABASE_URL;
  console.log(`URL present in .env.local: ${Boolean(parsed)}`);
  console.log(`Effective URL matches .env.local: ${value === parsed}`);
  console.log(`Database key definitions: ${(file.match(/^\s*(?:export\s+)?LEADS_DATABASE_URL\s*=/gm) ?? []).length}`);
  if (!value || value !== parsed) throw new Error('configuration');
  const url = new URL(value);
  if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname || !url.username || !url.password || url.pathname.length < 2) throw new Error('configuration');
  console.log(`Hostname: ${url.hostname}`);
  console.log(`Unencoded dollar sign present: ${value.includes('$')} (encode credential characters to avoid Next.js expansion)`);
  stage = 'DNS';
  await lookup(url.hostname);
  console.log('DNS: PASS');
  stage = 'Postgres connection';
  client = new pg.Client({ connectionString: value, connectionTimeoutMillis: 15000, query_timeout: 10000, statement_timeout: 10000, lock_timeout: 3000 });
  await client.connect();
  await client.query('SELECT 1');
  console.log('Postgres connection: PASS');
  stage = 'migration rollback check';
  const migration = await readFile(new URL('../db/migrations/0002_webfactory_requests.sql', import.meta.url), 'utf8');
  if (!/^BEGIN;\s/i.test(migration) || !/COMMIT;\s*$/i.test(migration)) throw new Error('unexpected migration envelope');
  await client.query(migration.replace(/COMMIT;\s*$/i, 'ROLLBACK;'));
  console.log('Migration executable: PASS (rolled back; no changes retained)');
} catch (error) {
  const code = safeCodes.has(error?.code) ? error.code : 'CHECK_FAILED';
  console.error(`${stage}: FAIL (${code}). No credentials logged.`);
  console.error('Subsequent checks: NOT RUN.');
  process.exitCode = 1;
} finally {
  if (client) { await client.query('ROLLBACK').catch(() => {}); await client.end().catch(() => {}); }
}
