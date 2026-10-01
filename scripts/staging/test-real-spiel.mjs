import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash, createHmac, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parseEnv } from "node:util";
import pg from "pg";
import ts from "typescript";
import { z } from "zod";

const root = process.cwd();
const branch = execFileSync("git", ["branch", "--show-current"], { encoding: "utf8" }).trim();
if (path.basename(root).toLowerCase() !== "rs-website-factory-redesign-stage" || branch !== "redesign/webfactory-v2") throw new Error("Staging checkout required.");
const env = parseEnv(readFileSync(".env.staging.local", "utf8"));
const url = new URL(env.LEADS_DATABASE_URL || "postgres://invalid/");
if (url.hostname !== "127.0.0.1" || url.port !== "55433" || url.pathname !== "/wf_stage") throw new Error("Refusing to test a non-staging database.");
const base = process.env.STAGING_TEST_BASE_URL || "http://127.0.0.1:3017";
if (!/^http:\/\/(?:localhost|127\.0\.0\.1):\d{2,5}$/.test(base)) throw new Error("Only a local staging server may receive this test request.");
const slug = "real-spiel-cleaning-company";
const site = JSON.parse(readFileSync("customers/manifest.json", "utf8")).customers.find(item => item.slug === slug);
assert.equal(site?.status, "draft");
assert.equal(site?.form.mode, "disabled");
for (const file of ["customers/real-spiel-cleaning-company/site/customer.config.json", "components/customers/real-spiel-website.tsx", "public/customers/real-spiel-cleaning-company/logo.svg"]) assert.ok(readFileSync(file).length > 0, file);

const db = new pg.Client({ connectionString: url.toString(), connectionTimeoutMillis: 5000 });
await db.connect();
try {
  const result = await db.query(`SELECT r.id,r.customer_slug,w.stage,b.brief,b.model,
    (SELECT count(*) FROM webfactory.website_build_jobs j WHERE j.request_id=r.id) AS jobs
    FROM webfactory.requests r JOIN webfactory.build_workflows w ON w.request_id=r.id
    JOIN webfactory.ai_briefs b ON b.id=w.active_brief_id WHERE r.customer_slug=$1`, [slug]);
  assert.equal(result.rowCount, 1);
  const row = result.rows[0];
  assert.equal(row.stage, "build_approved");
  assert.equal(row.model, "staging-fixture");
  assert.equal(row.brief.customerSlug, slug);
  assert.equal(Number(row.jobs), 0);
  const testModule = { exports: {} };
  const code = ts.transpileModule(readFileSync("lib/webfactory/brief-schema.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function("require", "module", "exports", code)(name => name === "zod" ? { z } : undefined, testModule, testModule.exports);
  const brief = testModule.exports.briefSchema.parse(row.brief);
  const prompt = testModule.exports.codexBuildPrompt(brief, true);
  for (const required of [slug, "ADMIN APPROVED FOR BUILD", "Home, Services, About, Contact and Privacy", "customers/", "/api/leads/", "tenant isolation", "QA", "Do not deploy"]) assert.ok(prompt.includes(required), required);
  const session = Buffer.from(JSON.stringify({ user: env.WEBFACTORY_ADMIN_USER, exp: Date.now() + 3600000, nonce: randomBytes(16).toString("hex"), version: createHash("sha256").update(env.WEBFACTORY_ADMIN_PASSWORD).digest("hex") })).toString("base64url");
  const signature = createHmac("sha256", env.WEBFACTORY_SESSION_SECRET).update(session).digest("hex");
  const admin = await fetch(`${base}/admin/requests/${row.id}`, { headers: { Cookie: `wf_admin=${session}.${signature}` }, redirect: "manual" });
  assert.equal(admin.status, 200);
  const adminHtml = await admin.text();
  for (const label of ["Current state:", "Next action:", "Blocked reason:", "Required before continuing:", "Generate Build Prompt", "Copy Prompt", "Download Prompt", "View required files", "View approved brief", "View build requirements", "View QA checklist", "Open draft on this deployment"]) assert.ok(adminHtml.includes(label), label);
  const home = await fetch(`${base}/${slug}`);
  assert.equal(home.status, 200);
  assert.ok((await home.text()).includes(site.business.name));
  const alias = await fetch(`${base}/preview/${slug}`, { redirect: "manual" });
  assert.equal(alias.status, 307);
  assert.equal(alias.headers.get("location"), `/${slug}`);
  const contact = await fetch(`${base}/${slug}/contact`);
  assert.equal(contact.status, 200);
  assert.ok((await contact.text()).includes("Form disabled"));
  const form = new FormData();
  for (const [key, value] of Object.entries({ name: "Synthetic QA", email: "qa@example.com", phone: "2255550100", service: "Cleaning", message: "Local disabled-mode safety check", consent: "on" })) form.set(key, value);
  const lead = await fetch(`${base}/api/leads/${slug}`, { method: "POST", body: form });
  assert.equal(lead.status, 503);
  const approval = await db.query("SELECT count(*) AS count FROM webfactory.request_actions WHERE request_id=$1 AND action='customer_approved'", [row.id]);
  assert.equal(Number(approval.rows[0].count), 0);
  console.log("PASS: isolated REAL SPIEL request, slug, generated fixture brief, authenticated admin handoff, build-ready fallback prompt, site files, staging route, preview alias, QA gates, inactive contact endpoint, no customer approval.");
} finally { await db.end(); }
