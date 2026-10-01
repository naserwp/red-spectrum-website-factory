import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const base = (process.env.STUDIO_TEST_BASE_URL || "http://localhost:3012").replace(/\/$/, "");
const manifest = JSON.parse(readFileSync("customers/manifest.json", "utf8"));
const saved = JSON.parse(readFileSync("customers/jm0616studio/site/customer.config.json", "utf8"));
assert.deepEqual(saved, manifest.customers.find((customer) => customer.slug === "jm0616studio"));

for (const section of ["", "/services", "/about", "/contact", "/privacy"]) {
  const response = await fetch(`${base}/jm0616studio${section}`);
  assert.equal(response.status, 200, `jm0616studio${section}`);
  const html = await response.text();
  assert.match(html, /<meta name="robots" content="noindex/);
  assert.ok(!html.includes("Swenzy Logistics"), "cross-tenant content");
  if (section === "/contact") {
    assert.match(html, /<fieldset disabled/);
    assert.match(html, /Nothing entered here is sent or saved/);
  }
}

for (const path of ["/jm0616studio/not-a-page", "/customers/jm0616studio/delivery/myndy-context.md"]) {
  assert.equal((await fetch(base + path)).status, 404, `${path} must remain private or unavailable`);
}
for (const path of ["/customers/jm0616studio/logo.svg", "/customers/jm0616studio/paper-study.webp"]) {
  assert.equal((await fetch(base + path)).status, 200, `${path} asset`);
}
assert.equal((await fetch(base + "/api/admin/ai/chat", { method: "POST" })).status, 401);
console.log("PASS: JM0616STUDIO routes, registered configuration, assets, inactive form, privacy and admin boundary.");
