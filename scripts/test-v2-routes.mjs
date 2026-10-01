import assert from "node:assert/strict";

const base = process.env.V2_TEST_BASE_URL ?? "http://127.0.0.1:3017";
const publicRoutes = ["/", "/designs", "/request", "/processing", "/privacy", "/checkout", "/sitemap", "/client/login", "/client", "/client/projects", "/client/projects/sample-project", "/client/messages", "/client/files", "/client/profile", "/client/delivery/sample-project"];
const designs = ["forge-&-field", "ledger-&-line", "stillwater-studio", "beacon-logistics", "meridian-artisan-bakehouse", "ironwood-custom-homes"];
const templates = ["forge", "ledger", "stillwater", "beacon", "meridian", "ironwood"];
const sections = ["", "/services", "/about", "/work", "/contact"];

for (const route of [...publicRoutes, ...designs.map((slug) => `/designs/${slug}`), ...templates.flatMap((slug) => sections.map((section) => `/templates/${slug}${section}`))]) {
  const response = await fetch(base + route, { redirect: "manual" });
  assert.equal(response.status, 200, `${route}: ${response.status}`);
  if (["/", "/designs", "/request", "/processing", "/privacy"].includes(route)) {
    const html = await response.text();
    for (const privateField of ["access_hash", "admin_session_hash", "LEADS_DATABASE_URL", "WEBFACTORY_ADMIN_PASSWORD"]) assert.ok(!html.includes(privateField), `${route} exposed ${privateField}`);
  }
}

for (const route of ["/admin", "/admin/requests", "/admin/ai", "/admin/activity", "/admin/users", "/admin/delivery", "/admin/pilot"]) {
  const response = await fetch(base + route, { redirect: "manual" });
  assert.equal(response.status, 307, `${route} should require admin authentication`);
  assert.equal(response.headers.get("location"), "/admin/login", `${route} login redirect`);
}

for (const route of ["/designs/unknown-design", "/templates/unknown", "/client/projects/another-client", "/client/delivery/another-client", "/preview/not-a-customer"]) {
  const response = await fetch(base + route, { redirect: "manual" });
  assert.equal(response.status, 404, `${route} should be unavailable`);
}

const registeredPreview = await fetch(base + "/preview/swenzy-logistics", { redirect: "manual" });
assert.equal(registeredPreview.status, 307);
assert.equal(registeredPreview.headers.get("location"), "/swenzy-logistics");

const requestHtml = await (await fetch(base + "/request")).text();
for (const field of ['name="name"', 'name="business"', 'name="email"', 'name="details"', 'name="consent"', 'name="submissionId"']) {
  assert.ok(requestHtml.includes(field), `real request form is missing ${field}`);
}
const loginHtml = await (await fetch(base + "/admin/login")).text();
assert.ok(loginHtml.includes('name="username"') && loginHtml.includes('name="password"'), "real admin login fields must remain present");
const checkoutHtml = await (await fetch(base + "/checkout")).text();
assert.ok(checkoutHtml.includes("Checkout unavailable") && checkoutHtml.includes("No card details are collected"), "checkout must remain inactive");

console.log(`PASS: ${publicRoutes.length + designs.length + templates.length * sections.length} public/sample routes, 7 protected routes, 5 unavailable routes, registered preview alias, real request and admin forms, inactive checkout, public HTML privacy markers.`);
