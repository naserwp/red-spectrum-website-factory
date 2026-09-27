import { readFile } from "node:fs/promises";
import { Client } from "pg";

const databaseUrl = process.env.LEADS_DATABASE_URL;
if (!databaseUrl) throw new Error("LEADS_DATABASE_URL is required. Refusing to use local or in-memory lead storage.");

const client = new Client({ connectionString: databaseUrl, ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined });
try {
  await client.connect();
  await client.query("BEGIN");
  for (const file of ["0001_website_leads.sql", "0007_lead_investment_details.sql"]) {
    await client.query(await readFile(new URL("../db/migrations/" + file, import.meta.url), "utf8"));
  }
  await client.query("COMMIT");
  console.log("Applied website lead persistence migration.");
} catch {
  await client.query("ROLLBACK").catch(() => {});
  console.error("Lead migration failed. Check database connectivity and schema permissions. No credentials logged.");
  process.exitCode = 1;
} finally {
  await client.end();
}
