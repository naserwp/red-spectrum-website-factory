import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const base = (process.env.PUBLIC_EXPERIENCE_TEST_BASE_URL || "http://localhost:3012").replace(/\/$/, "");
const routes = ["/", "/designs", "/request", "/processing", "/checkout", "/privacy", "/admin/login"];
const customerRoutes = ["/unique-home-enterprise", "/unique-management-group"];
const browserCli = process.env.AGENT_BROWSER_CLI;
assert.ok(browserCli, "Set AGENT_BROWSER_CLI to the existing browser CLI path.");

const runBrowser = (...args) => {
  try {
    return execFileSync(process.execPath, [browserCli, "--session", "public-experience-qa", ...args], { encoding: "utf8", timeout: 12000 }).trim();
  } catch (error) {
    // In this headless environment `open` completes navigation but its daemon
    // client can remain attached until timeout. Confirm the URL before treating
    // that specific timeout as a completed navigation.
    if (args[0] === "open" && String(error.stdout || "").includes(args[1])) {
      const current = execFileSync(process.execPath, [browserCli, "--session", "public-experience-qa", "get", "url"], { encoding: "utf8", timeout: 10000 }).trim();
      if (current === args[1]) return current;
    }
    throw error;
  }
};
const evalJson = (expression) => JSON.parse(runBrowser("eval", expression));

for (const route of routes) {
  const response = await fetch(base + route, { redirect: "manual" });
  assert.equal(response.status, 200, `${route} should load`);
  const html = await response.text();
  assert.match(html, /<h1[\s>]/, `${route} should have a page heading`);
  assert.match(html, /RS WebFactory/, `${route} should render the real WebFactory shell`);
}

const requestHtml = await (await fetch(base + "/request")).text();
for (const field of ['name="name"', 'name="business"', 'name="email"', 'name="details"', 'name="consent"', 'name="submissionId"']) assert.ok(requestHtml.includes(field), `real request form is missing ${field}`);
assert.ok(!/static demo|nothing is submitted|sample request/i.test(requestHtml), "request page must not use demo-only submission behavior");
const loginHtml = await (await fetch(base + "/admin/login")).text();
assert.ok(loginHtml.includes('name="username"') && loginHtml.includes('name="password"'), "admin login fields must remain present");
assert.ok(!/public demo access is on|no username or password is required/i.test(loginHtml), "admin login must not inherit prototype access copy");
const checkoutHtml = await (await fetch(base + "/checkout")).text();
assert.ok(checkoutHtml.includes("Checkout unavailable") && checkoutHtml.includes("No card details are collected"), "checkout must retain the manual-review safety state");

runBrowser("open", base + "/");
assert.ok(evalJson("document.querySelector('.wf-home-hero h1')?.innerText.includes('One clear path to launch')"), "home must show the new launch message");
const navHrefs = evalJson("JSON.stringify([...document.querySelectorAll('.wf-header nav[aria-label=\\\"Main navigation\\\"] a')].map(link => link.getAttribute('href')))");
for (const href of ["/designs", "/processing", "/admin/login", "/request"]) assert.ok(navHrefs.includes(href), `primary navigation is missing ${href}`);
runBrowser("open", base + "/request");
assert.ok(evalJson("Array.from(document.querySelectorAll('input:not([type=hidden]),textarea,select')).every(el => el.labels?.length || el.getAttribute('aria-label'))"), "request fields must have accessible labels");
runBrowser("open", base + "/admin/login");
assert.ok(evalJson("Array.from(document.querySelectorAll('input:not([type=hidden]),textarea,select')).every(el => el.labels?.length || el.getAttribute('aria-label'))"), "login fields must have accessible labels");
for (const route of routes) {
  runBrowser("open", base + route);
  for (const width of [320, 375, 768, 1024, 1440, 1920]) {
    runBrowser("set", "viewport", String(width), "900");
    assert.equal(evalJson("document.documentElement.scrollWidth > window.innerWidth"), false, `${route} overflows at ${width}px`);
    assert.ok(evalJson("!!document.querySelector('.wf-header nav[aria-label=\"Main navigation\"]')"), `${route} is missing primary navigation`);
  }
}

runBrowser("open", base + "/");
runBrowser("set", "viewport", "320", "900");
runBrowser("eval", "document.querySelector('.wf-mobile').open = true");
assert.ok(evalJson("!!document.querySelector('.wf-mobile[open] nav a[href=\"/designs\"]')"), "mobile menu should expose working route links");
assert.ok(evalJson("!!document.querySelector('.wf-skip[href=\"#content\"]')"), "skip navigation should remain available");

if (!new URL(base).hostname.match(/^(?:localhost|127\.0\.0\.1)$/)) {
  for (const route of customerRoutes) {
    const response = await fetch(base + route, { redirect: "manual" });
    assert.equal(response.status, 200, `${route} customer site should remain available`);
    const html = await response.text();
    assert.ok(!html.includes("wf-home-hero"), `${route} must not inherit WebFactory public layout`);
  }
}

const scopedCss = readFileSync("components/webfactory/public-experience.css", "utf8");
assert.ok(scopedCss.includes(".wf :focus-visible") || scopedCss.includes(".wf a:focus-visible"), "scoped keyboard focus styling is required");
assert.ok(scopedCss.includes("prefers-reduced-motion"), "reduced-motion support is required");
assert.doesNotMatch(scopedCss, /(^|})\s*(?:html|body|:root|\*)\s*\{/m, "public design styles must not use global selectors");
assert.ok(readFileSync("components/webfactory/webfactory.css", "utf8").includes(".wf-skip:focus"), "skip-link focus state is required");
runBrowser("close");
console.log("PASS: public route/form/auth behavior, six responsive widths, navigation, accessible labels/focus styles, reduced motion, and CSS namespace isolation.");
