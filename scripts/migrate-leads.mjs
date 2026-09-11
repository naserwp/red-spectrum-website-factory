import { readFile } from "node:fs/promises";
import { Client } from "pg";

const databaseUrl = process.env.LEADS_DATABASE_URL;
if (!databaseUrl) throw new Error("LEADS_DATABASE_URL is required. Refusing to use local or in-memory lead storage.");

const migration = await readFile(new URL("../db/migrations/0001_website_leads.sql", import.meta.url), "utf8");
const client = new Client({ connectionString: databaseUrl, ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined });
await client.connect();
try {
  await client.query("BEGIN");
  await client.query(migration);
  await client.query("COMMIT");
  console.log("Applied website lead persistence migration.");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
