import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const agentId = "agent_1790790948_rwhM6iVfBBVQx2lJTGf0Fw";
const scriptUrl = "https://widget.myndy.ai/myndy-convai-widget.es.js";
const manifest = JSON.parse(readFileSync("customers/manifest.json", "utf8"));
const config = JSON.parse(readFileSync("customers/unique-home-enterprise/site/customer.config.json", "utf8"));
const renderer = readFileSync("components/unique-home-b2b.tsx", "utf8");
const widget = readFileSync("components/unique-home-myndy.tsx", "utf8");
const context = readFileSync("customers/unique-home-enterprise/myndy/agent-context.md", "utf8");
const customer = manifest.customers.filter((site) => site.slug === "unique-home-enterprise");

assert.equal(customer.length, 1, "Unique Home slug must have one canonical manifest record");
assert.equal(config.myndy.embed.enabled, true);
assert.deepEqual(config.myndy.embed, { enabled: true, agentId, scriptUrl });
assert.deepEqual(customer[0].myndy.embed, config.myndy.embed);
assert.equal(manifest.customers.filter((site) => site.slug !== "unique-home-enterprise" && site.myndy.embed.agentId === agentId).length, 0);
assert.match(renderer, /domain\?\.slug === site\.slug/);
assert.match(renderer, /agentId === 'agent_1790790948_rwhM6iVfBBVQx2lJTGf0Fw'/);
assert.match(widget, /type="module"/);
assert.match(widget, /async/);
assert.match(widget, /strategy="afterInteractive"/);
assert.match(widget, /widget\.setAttribute\("agent_id", agentId\)/);
assert.match(context, /B2B marketing, consulting, advertising, and real-estate-oriented/);
assert.match(context, /Do not promise brokerage, transactions, investment or financial advice/);
assert.match(config.pages.privacy.body.join(" "), /connects your browser to Myndy/);
assert.match(config.pages.privacy.body.join(" "), /inactive on review previews/);
assert.match(readFileSync("lib/leads/config.ts", "utf8"), /"unique-home-enterprise":\s*\{\s*liveRecipient:\s*"contact@uniquehomeenterprise\.com"/);

console.log("PASS: exact tenant/agent/script registration, production-only renderer guard, context and privacy disclosure, and unchanged UNIQUE HOME lead recipient.");
