import { readFile } from 'node:fs/promises';
import pg from 'pg';
const url = process.env.LEADS_DATABASE_URL;
if (!url) { console.error('LEADS_DATABASE_URL is required. No migration applied.'); process.exitCode = 1; }
else { const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 5000 }); try { await client.connect(); for (const file of ['0002_webfactory_requests.sql','0003_webfactory_ai.sql','0004_webfactory_ai_chat.sql']) await client.query(await readFile(new URL('../db/migrations/'+file,import.meta.url),'utf8')); console.log('WebFactory request migration applied.'); } catch { console.error('WebFactory migration failed. Check database connectivity and schema permissions. No credentials logged.'); process.exitCode=1; } finally { await client.end(); } }
