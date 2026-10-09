import { readFile } from 'node:fs/promises';
import pg from 'pg';
const url = process.env.LEADS_DATABASE_URL;
if (!url) { console.error('LEADS_DATABASE_URL is required. No migration applied.'); process.exitCode = 1; }
else { const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 5000 }); try { await client.connect(); for (const file of ['0002_webfactory_requests.sql','0003_webfactory_ai.sql','0004_webfactory_ai_chat.sql','0005_webfactory_reviews.sql','0006_webfactory_slugs_actions.sql','0008_webfactory_build_jobs.sql','0009_webfactory_build_worker.sql','0011_webfactory_approval_audit.sql','0012_webfactory_worker_health.sql']) await client.query(await readFile(new URL('../db/migrations/'+file,import.meta.url),'utf8')); console.log('WebFactory request migration applied.'); } catch { console.error('WebFactory migration failed. Check database connectivity and schema permissions. No credentials logged.'); process.exitCode=1; } finally { await client.end(); } }
