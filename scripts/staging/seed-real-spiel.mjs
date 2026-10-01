import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { parseEnv } from "node:util";
import pg from "pg";

const root = process.cwd();
const branch = execFileSync("git", ["branch", "--show-current"], { encoding: "utf8" }).trim();
if (path.basename(root).toLowerCase() !== "rs-website-factory-redesign-stage" || branch !== "redesign/webfactory-v2") throw new Error("Staging checkout required.");
const env = parseEnv(readFileSync(".env.staging.local", "utf8"));
const url = new URL(env.LEADS_DATABASE_URL || "postgres://invalid/");
if (url.hostname !== "127.0.0.1" || url.port !== "55433" || url.pathname !== "/wf_stage") throw new Error("Refusing to seed a non-staging database.");

const slug = "real-spiel-cleaning-company";
const site = JSON.parse(readFileSync("customers/manifest.json", "utf8")).customers.find(item => item.slug === slug);
if (!site || site.form.mode !== "disabled") throw new Error("REAL SPIEL draft site or its disabled form is missing.");
const requestId = "b3c0f7d6-d455-4f04-ac44-c61b771e9201";
const pageNames = ["Home", "Services", "About", "Contact", "Privacy"];
const brief = {
  customerSlug: slug,
  businessSummary: "Synthetic staging fixture for the REAL SPIEL draft website. Customer claims and contact details are unverified.",
  brandDirection: "Use the existing REAL SPIEL draft identity; customer approval remains outstanding.",
  colorDirection: `${site.branding.primary}, ${site.branding.secondary}, ${site.branding.accent}`,
  logoConcept: "Use the existing original draft mark only.",
  pages: pageNames.map(name => ({ name, purpose: `Review the draft ${name.toLowerCase()} page.`, sections: ["Draft content", "Customer confirmation required"] })),
  services: site.services.map(service => service.name),
  seo: { title: site.seo.title, metaDescription: site.seo.description },
  hero: { heading: site.pages.home.headline, body: site.pages.home.intro },
  ctaCopy: [site.pages.home.ctaLabel],
  myndy: { agentName: site.myndy.agentName, avatarBrief: site.myndy.avatarBrief, greeting: site.myndy.greeting, context: "Disabled draft only.", faqs: [], qualificationFlow: [], escalationRules: [] },
  imagePrompts: [site.images.hero.alt],
  customerEmailDraft: "DRAFT ONLY — no message sent.", smsDraft: "DRAFT ONLY — no message sent.",
  missingInformation: ["Confirmed business contact", "Service area", "Approved service scope", "Privacy notice", "Customer approval"],
  verificationNotes: ["Staging fixture derived from the committed draft site; no AI call or customer approval occurred."],
};

const db = new pg.Client({ connectionString: url.toString(), connectionTimeoutMillis: 5000 });
await db.connect();
try {
  await db.query("BEGIN");
  const existing = await db.query("SELECT id FROM webfactory.requests WHERE id=$1 OR customer_slug=$2", [requestId, slug]);
  if (existing.rowCount) {
    if (existing.rowCount !== 1 || existing.rows[0].id !== requestId) throw new Error("REAL SPIEL slug belongs to another staging request.");
    await db.query("COMMIT");
    console.log(`PASS: existing isolated REAL SPIEL staging fixture ${requestId}`);
  } else {
    const briefId = randomUUID();
    await db.query("SELECT set_config('webfactory.actor', 'staging fixture', true)");
    await db.query(`INSERT INTO webfactory.requests(id,submission_id,access_hash,name,business,email,phone,industry,details,status,customer_slug,slug_confirmed_at)
      VALUES($1,$2,'staging-fixture','Staging QA fixture',$3,'qa+real-spiel@example.invalid','','Cleaning Services','Synthetic local validation record derived from the committed draft site. No customer contact or approval.','reviewing',$4,NOW())`, [requestId, randomUUID(), site.business.name, slug]);
    await db.query("INSERT INTO webfactory.ai_briefs(id,request_id,status,model,brief,completed_at) VALUES($1,$2,'generated','staging-fixture',$3,NOW())", [briefId, requestId, JSON.stringify(brief)]);
    await db.query("INSERT INTO webfactory.build_workflows(request_id,active_brief_id,stage) VALUES($1,$2,'build_approved')", [requestId, briefId]);
    await db.query("INSERT INTO webfactory.request_actions(request_id,actor,action,status_after,customer_slug,notes) VALUES($1,'staging fixture','fixture_build_approved','build_approved',$2,'Synthetic local validation state only; not an admin or customer approval.')", [requestId, slug]);
    await db.query("COMMIT");
    console.log(`PASS: isolated REAL SPIEL staging fixture ${requestId}; generated brief and synthetic build-ready state, with no customer approval or outbound actions.`);
  }
} catch (error) {
  await db.query("ROLLBACK");
  throw error;
} finally { await db.end(); }
