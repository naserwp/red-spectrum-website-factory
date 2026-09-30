import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

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
