import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const config = JSON.parse(readFileSync("customers/unique-home-enterprise/site/customer.config.json", "utf8"));
const manifest = JSON.parse(readFileSync("customers/manifest.json", "utf8"));
const site = manifest.customers.find((customer) => customer.slug === "unique-home-enterprise");
const renderer = readFileSync("components/unique-home-b2b.tsx", "utf8");
const form = readFileSync("components/unique-home-inquiry-form.tsx", "utf8");
const proxy = readFileSync("proxy.ts", "utf8");
const route = readFileSync("app/[customerSlug]/[[...page]]/page.tsx", "utf8");
const leads = readFileSync("lib/leads/config.ts", "utf8");

assert.equal(config.contact.email.value, "contact@uniquehomeenterprise.com");
assert.equal(site.contact.email.value, "contact@uniquehomeenterprise.com");
assert.equal(config.myndy.embed.enabled, true);
assert.equal(config.myndy.embed.agentId, "agent_1790790948_rwhM6iVfBBVQx2lJTGf0Fw");
assert.equal(config.form.mode, "live");
for (const source of [JSON.stringify(config), JSON.stringify(site), renderer, form, route]) {
  assert.equal(source.includes("niha_aminul@hotmail.com"), false);
}
assert.match(renderer, /page === 'thank-you'/);
assert.match(renderer, /Thank you\. Your inquiry has been/);
assert.match(renderer, /received your message and the team can review your inquiry/);
assert.match(form, /window\.location\.assign\("\/thank-you"\)/);
assert.match(form, /!response\.ok \|\| body\.ok !== true/);
assert.match(proxy, /'\/thank-you'/);
assert.match(route, /robots: \{ index: false, follow: false \}/);
assert.match(leads, /liveRecipient: "contact@uniquehomeenterprise\.com"/);
assert.match(renderer, /myndyActive && <UniqueHomeMyndy/);

console.log("PASS: UNIQUE HOME public business email, thank-you redirect, noindex route, and unchanged lead recipient.");
