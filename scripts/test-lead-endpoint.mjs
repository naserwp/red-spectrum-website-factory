import assert from "node:assert/strict";

const baseUrl = process.env.LEAD_TEST_BASE_URL ?? "http://localhost:3007";

async function submit(slug, extra = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({
    name: "Synthetic Test",
    email: "synthetic@example.com",
    phone: "2255550100",
    service: "Transportation inquiry",
    message: "Local no-delivery backend smoke test.",
    consent: "on",
    ...extra,
  })) form.set(key, value);
  const response = await fetch(`${baseUrl}/api/leads/${slug}`, { method: "POST", body: form });
  return { status: response.status, body: await response.json() };
}

const disabled = await submit("swenzy-logistics");
const tampered = await submit("swenzy-logistics", { recipient: "attacker@example.com", sender: "attacker@example.com", mode: "live" });
const unknown = await submit("not-a-customer");
assert.equal(disabled.status, 503);
assert.equal(tampered.status, 400);
assert.equal(unknown.status, 404);
console.log(JSON.stringify({ disabled, tampered, unknown }, null, 2));
