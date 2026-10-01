import assert from "node:assert/strict";

const base = process.env.V2_TEST_BASE_URL ?? "http://127.0.0.1:3017";
const publicRoutes = ["/", "/designs", "/request", "/processing", "/privacy", "/checkout", "/sitemap", "/client/login"];
const designs = ["forge-&-field", "ledger-&-line", "stillwater-studio", "beacon-logistics", "meridian-artisan-bakehouse", "ironwood-custom-homes"];
const templates = ["forge", "ledger", "stillwater", "beacon", "meridian", "ironwood"];
const sections = ["", "/services", "/about", "/work", "/contact"];

async function assertProtected(route, login) {
  const response = await fetch(base + route, { redirect: "manual" });
  if (response.status === 307) {
    assert.equal(response.headers.get("location"), login, `${route} login redirect`);
    return;
  }
  // Next can stream the shell before a server-component redirect and send a refresh instead.
  assert.equal(response.status, 200, `${route} must redirect or stream a redirect`);
  const html = await response.text();
  assert.ok(html.includes(`http-equiv="refresh" content="1;url=${login}"`), `${route} streamed login redirect`);
  for (const privateField of ["access_hash", "admin_session_hash", "LEADS_DATABASE_URL", "WEBFACTORY_ADMIN_PASSWORD"]) assert.ok(!html.includes(privateField), `${route} exposed ${privateField}`);
}

for (const route of [...publicRoutes, ...designs.map((slug) => `/designs/${slug}`), ...templates.flatMap((slug) => sections.map((section) => `/templates/${slug}${section}`))]) {
  const response = await fetch(base + route, { redirect: "manual" });
  assert.equal(response.status, 200, `${route}: ${response.status}`);
  if (["/", "/designs", "/request", "/processing", "/privacy"].includes(route)) {
    const html = await response.text();
    for (const privateField of ["access_hash", "admin_session_hash", "LEADS_DATABASE_URL", "WEBFACTORY_ADMIN_PASSWORD"]) assert.ok(!html.includes(privateField), `${route} exposed ${privateField}`);
  }
}

for (const route of ["/admin", "/admin/requests", "/admin/ai", "/admin/activity", "/admin/users", "/admin/delivery", "/admin/pilot"]) {
  await assertProtected(route, "/admin/login");
}

for (const route of ["/client", "/client/projects", "/client/messages", "/client/files", "/client/profile", "/client/projects/current", "/client/delivery/current"]) {
  await assertProtected(route, "/client/login");
}

for (const route of ["", "/about", "/services", "/contact", "/privacy"]) {
  const response = await fetch(base + "/real-spiel-cleaning-company" + route);
  assert.equal(response.status, 200, `REAL SPIEL ${route || "home"}`);
  const html = await response.text();
  assert.ok(html.includes("REAL SPIEL CLEANING COMPANY"), `REAL SPIEL identity ${route}`);
  assert.ok(html.includes('content="noindex,nofollow"') || html.includes('name="robots" content="noindex'), `REAL SPIEL draft noindex ${route}`);
  if (route === "/contact") assert.ok(html.includes("Form disabled") && !html.includes('name="email"'), "REAL SPIEL contact must not collect data while disabled");
}

for (const route of ["/designs/unknown-design", "/templates/unknown", "/client/projects/another-client", "/client/delivery/another-client", "/preview/not-a-customer"]) {
  const response = await fetch(base + route, { redirect: "manual" });
  if (response.status !== 404) {
    assert.equal(response.status, 200, `${route} should be unavailable`);
    assert.ok((await response.text()).includes("NEXT_HTTP_ERROR_FALLBACK;404"), `${route} streamed not-found boundary`);
  }
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
assert.ok(checkoutHtml.includes("Checkout unavailable") && checkoutHtml.includes("No card information is collected"), "checkout must remain inactive");

console.log(`PASS: ${publicRoutes.length + designs.length + templates.length * sections.length} public routes, 7 admin protected routes, 7 client protected routes, 5 unavailable routes, registered preview alias, real request and admin forms, inactive checkout, public HTML privacy markers.`);
