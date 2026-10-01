import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
const require = createRequire(import.meta.url);
const load = (file, deps = {}) => {
  const testModule = { exports: {} };
  const source = ts.transpileModule(readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function("require", "module", "exports", source)(name => name === "server-only" ? {} : name in deps ? deps[name] : require(name), testModule, testModule.exports);
  return testModule.exports;
};
const keys = ["VERCEL_ENV", "LEADS_DATABASE_URL", "WEBFACTORY_STAGING_DATABASE_URL", "WEBFACTORY_ADMIN_USER", "WEBFACTORY_ADMIN_PASSWORD", "WEBFACTORY_SESSION_SECRET", "WEBFACTORY_INTERNAL_NOTIFICATIONS_ENABLED", "WEBFACTORY_CUSTOMER_EMAILS_ENABLED", "SENDGRID_API_KEY", "LEADS_FROM_EMAIL", "LEADS_FROM_NAME", "LEADS_RATE_LIMIT_SALT", "WEBFACTORY_REQUEST_NOTIFY_EMAIL"];
const saved = Object.fromEntries(keys.map(key => [key, process.env[key]]));
try {
  Object.assign(process.env, { VERCEL_ENV: "preview", LEADS_DATABASE_URL: "postgres://production-would-be-unsafe.invalid/live", WEBFACTORY_ADMIN_USER: "synthetic", WEBFACTORY_ADMIN_PASSWORD: "synthetic", WEBFACTORY_SESSION_SECRET: "synthetic-session-secret-long-enough-123", WEBFACTORY_INTERNAL_NOTIFICATIONS_ENABLED: "true", WEBFACTORY_CUSTOMER_EMAILS_ENABLED: "true", SENDGRID_API_KEY: "synthetic", LEADS_FROM_EMAIL: "qa@example.com", LEADS_FROM_NAME: "Red Spectrum Leads", LEADS_RATE_LIMIT_SALT: "synthetic", WEBFACTORY_REQUEST_NOTIFY_EMAIL: "qa@example.com" });
  delete process.env.WEBFACTORY_STAGING_DATABASE_URL;
  const server = load("lib/webfactory/server.ts", { "next/headers": { cookies: async () => ({}), headers: async () => ({}) } });
  const leads = load("lib/leads/config.ts");
  const email = load("lib/leads/email.ts");
  assert.throws(() => server.database(), /Storage unavailable/);
  assert.equal(server.adminConfigured(), false);
  process.env.WEBFACTORY_STAGING_DATABASE_URL = process.env.LEADS_DATABASE_URL;
  assert.throws(() => server.database(), /Staging storage isolation required/);
  assert.equal(server.adminConfigured(), false);
  delete process.env.WEBFACTORY_STAGING_DATABASE_URL;
  assert.equal(server.notificationReady(), false);
  assert.equal(leads.leadEmailEnabled("test"), false);
  assert.equal(leads.leadEmailEnabled("live"), false);
  assert.equal(leads.getSendGridConfig(), null);
  await assert.rejects(() => email.sendSendGridNotification({ apiKey: "synthetic", fromEmail: "qa@example.com", fromName: "QA" }, { recipient: "qa@example.com", subject: "QA", lead: { deliveryMode: "test" } }), /email_disabled/);
  console.log("PASS: Vercel branch preview ignores shared production DB, disables admin when isolated DB is absent, and blocks all notification paths.");
} finally {
  for (const key of keys) if (saved[key] === undefined) delete process.env[key]; else process.env[key] = saved[key];
}
