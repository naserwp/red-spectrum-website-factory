import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const manifest = JSON.parse(readFileSync("customers/manifest.json", "utf8"));
const config = JSON.parse(readFileSync("customers/unique-home-enterprise/site/customer.config.json", "utf8"));
const renderer = readFileSync("components/unique-home-b2b.tsx", "utf8");
const context = readFileSync("customers/unique-home-enterprise/myndy/agent-context.md", "utf8");
const customer = manifest.customers.filter((site) => site.slug === "unique-home-enterprise");

assert.equal(customer.length, 1, "Unique Home slug must have one canonical manifest record");
assert.deepEqual(config.myndy.embed, { enabled: true, agentId: "agent_1790790948_rwhM6iVfBBVQx2lJTGf0Fw", scriptUrl: "https://widget.myndy.ai/myndy-convai-widget.es.js" });
assert.deepEqual(customer[0].myndy.embed, config.myndy.embed);
assert.match(renderer, /myndyActive && <UniqueHomeMyndy/);
assert.equal(manifest.customers.filter((site) => site.slug !== "unique-home-enterprise" && site.myndy.embed.agentId === "agent_1790790948_rwhM6iVfBBVQx2lJTGf0Fw").length, 0);
assert.match(context, /B2B marketing, consulting, advertising, and real-estate-oriented/);
assert.match(context, /Do not promise brokerage, transactions, investment or financial advice/);
assert.match(context, /avatar labeled “factiiv Logo”/);
assert.match(config.pages.privacy.body.join(" "), /Myndy chat widget is loaded/);
assert.match(readFileSync("lib/leads/config.ts", "utf8"), /"unique-home-enterprise":\s*\{\s*liveRecipient:\s*"contact@uniquehomeenterprise\.com"/);

console.log("PASS: UNIQUE HOME widget configuration, tenant isolation, privacy copy, and lead recipient.");

const testModule = { exports: {} };
const code = ts.transpileModule(readFileSync("lib/leads/myndy-contacts.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
new Function("require", "module", "exports", code)((name) => {
  assert.equal(name, "server-only"); return {};
}, testModule, testModule.exports);
const { syncUniqueHomeContact, safeMyndyError } = testModule.exports;
const previousFetch = globalThis.fetch;
const previousKey = process.env.MYNDY_API_KEY_UNIQUE_HOME;
const lead = { customerSlug: "unique-home-enterprise", leadId: "internal-id-never-send", visitorName: "Synthetic QA", visitorEmail: "qa@example.com", visitorPhone: "+12025550123", requestedService: "Consulting", message: "Synthetic test" };
let payload, calls = 0, status = 200, detail;
try {
  process.env.MYNDY_API_KEY_UNIQUE_HOME = "mock-only";
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "https://hello.myndy.ai/api/webhooks/contacts");
    assert.equal(options.headers["X-API-Key"], "mock-only");
    payload = JSON.parse(options.body); calls++;
    return new Response(detail ? JSON.stringify({ detail }) : null, { status });
  };
  await syncUniqueHomeContact(lead);
  assert.deepEqual(payload, { name: "Synthetic QA", email: "qa@example.com", phone: "+12025550123", notes: ["Captured from uniquehomeenterprise.com", "Inquiry area: Consulting", "Message: Synthetic test"], tags: ["website", "unique-home-enterprise"] });
  await syncUniqueHomeContact({ ...lead, visitorPhone: " " });
  assert.equal("phone" in payload, false);
  await syncUniqueHomeContact({ ...lead, visitorEmail: " " });
  assert.equal("email" in payload, false);
  assert.equal(payload.name, lead.visitorName);
  status = 201; await syncUniqueHomeContact(lead);
  const before = calls;
  await assert.rejects(syncUniqueHomeContact({ ...lead, customerSlug: "another-customer" }), /myndy_tenant_mismatch/);
  assert.equal(calls, before);
  status = 422;
  detail = [{ loc: ["body", "notes"], type: "list_type", input: "private input", msg: "private provider message" }];
  await assert.rejects(syncUniqueHomeContact(lead), error => safeMyndyError(error) === "myndy_422_notes_list_type");
  detail = [{ loc: ["body", "name"], type: "missing" }];
  await assert.rejects(syncUniqueHomeContact(lead), error => safeMyndyError(error) === "myndy_422_name_missing");
  detail = [{ loc: ["body", "private-field"], type: "private-value" }];
  await assert.rejects(syncUniqueHomeContact(lead), error => safeMyndyError(error) === "myndy_422");
  console.log("PASS: exact Myndy payload, optional field omission, 2xx acceptance, tenant isolation, and sanitized 422 field diagnostics. No outbound requests.");
} finally {
  globalThis.fetch = previousFetch;
  if (previousKey === undefined) delete process.env.MYNDY_API_KEY_UNIQUE_HOME;
  else process.env.MYNDY_API_KEY_UNIQUE_HOME = previousKey;
}
