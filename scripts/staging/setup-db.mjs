import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseEnv } from "node:util";
import pg from "pg";

const root = process.cwd();
const branch = execFileSync("git", ["branch", "--show-current"], { cwd: root, encoding: "utf8" }).trim();
if (path.basename(root).toLowerCase() !== "rs-website-factory-redesign-stage" || branch !== "redesign/webfactory-v2") {
  throw new Error("Run only from the isolated WebFactory V2 staging checkout.");
}

const runtime = path.join(root, ".sites-runtime", "staging-db");
const data = path.join(runtime, "cluster");
const envFile = path.join(root, ".env.staging.local");
const developmentEnv = path.join(root, ".env.development.local");
if (!existsSync(envFile) && existsSync(developmentEnv)) throw new Error("Existing development env must be inspected before staging initialization.");
const port = 55433;
const binaryDir = process.env.PG_BIN || "C:\\Program Files\\PostgreSQL\\18\\bin";
const exe = (name) => path.join(binaryDir, `${name}.exe`);
for (const name of ["initdb", "pg_ctl"]) if (!existsSync(exe(name))) throw new Error(`PostgreSQL ${name} is unavailable; set PG_BIN to the installed bin directory.`);

const run = (name, args) => execFileSync(exe(name), args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const ready = () => { try { run("pg_ctl", ["-D", data, "status"]); return true; } catch { return false; } };

let values;
if (existsSync(envFile)) {
  values = parseEnv(readFileSync(envFile, "utf8"));
  const url = new URL(values.LEADS_DATABASE_URL || "postgres://invalid/");
  if (url.hostname !== "127.0.0.1" || url.port !== String(port) || url.pathname !== "/wf_stage") throw new Error("Existing staging environment does not point to the isolated local database.");
  if (!existsSync(path.join(data, "PG_VERSION"))) throw new Error("Staging env exists without its cluster. Inspect it manually; no files were replaced.");
  if (existsSync(developmentEnv)) {
    const development = parseEnv(readFileSync(developmentEnv, "utf8"));
    if (development.LEADS_DATABASE_URL !== values.LEADS_DATABASE_URL) throw new Error("Development env does not use the isolated staging database. Inspect it manually.");
  }
} else {
  if (existsSync(data)) throw new Error("Staging cluster already exists without its environment. Inspect it manually; no files were replaced.");
  mkdirSync(runtime, { recursive: true });
  const password = randomBytes(32).toString("hex");
  const passwordFile = path.join(runtime, "init-password.tmp");
  writeFileSync(passwordFile, `${password}\n`, { flag: "wx", mode: 0o600 });
  try {
    run("initdb", ["-D", data, "-U", "wf_staging", "--encoding=UTF8", "--auth-host=scram-sha-256", "--pwfile", passwordFile]);
  } finally { rmSync(passwordFile, { force: true }); }
  values = {
    LEADS_DATABASE_URL: `postgresql://wf_staging:${password}@127.0.0.1:${port}/wf_stage`,
    LEADS_RATE_LIMIT_SALT: randomBytes(32).toString("hex"),
    WEBFACTORY_ADMIN_USER: "staging-admin",
    WEBFACTORY_ADMIN_PASSWORD: randomBytes(32).toString("hex"),
    WEBFACTORY_SESSION_SECRET: randomBytes(48).toString("hex"),
    WEBFACTORY_INTERNAL_NOTIFICATIONS_ENABLED: "false",
    WEBFACTORY_CUSTOMER_EMAILS_ENABLED: "false",
    WEBFACTORY_LEAD_TEST_ACTIVE_SLUGS: "real-spiel-cleaning-company",
    WEBFACTORY_LEAD_LIVE_ACTIVE_SLUGS: "",
    WEBFACTORY_BUILD_EXECUTOR: "",
    WEBFACTORY_BUILD_WORKER_SECRET: "",
    AUTO_RECOVERY_ENABLED: "false",
    SENDGRID_API_KEY: "",
    OPENAI_API_KEY: "",
    CUSTOMER_INTELLIGENCE_API_KEY: "",
    WEBFACTORY_TEST_ENV_FILE: ".env.staging.local",
  };
  const content = Object.entries(values).map(([key, value]) => `${key}=${value}`).join("\n") + "\n";
  writeFileSync(envFile, content, { flag: "wx", mode: 0o600 });
  if (!existsSync(developmentEnv)) writeFileSync(developmentEnv, content, { flag: "wx", mode: 0o600 });
}

if (!ready()) execFileSync(exe("pg_ctl"), ["-D", data, "-l", path.join(runtime, "postgres.log"), "-o", `-h 127.0.0.1 -p ${port}`, "-w", "start"], { cwd: root, stdio: "ignore", timeout: 30000 });
const localUrl = new URL(values.LEADS_DATABASE_URL);
const client = new pg.Client({ connectionString: new URL("/postgres", localUrl).toString(), connectionTimeoutMillis: 5000 });
try {
  await client.connect();
  const exists = await client.query("SELECT 1 FROM pg_database WHERE datname = 'wf_stage'");
  if (!exists.rowCount) await client.query("CREATE DATABASE wf_stage");
} finally { await client.end(); }

const migrationEnv = { ...process.env, LEADS_DATABASE_URL: values.LEADS_DATABASE_URL, NODE_ENV: "development" };
for (const file of ["scripts/migrate-leads.mjs", "scripts/migrate-webfactory.mjs"]) {
  execFileSync(process.execPath, [file], { cwd: root, env: migrationEnv, stdio: ["ignore", "pipe", "pipe"] });
}
console.log("PASS: isolated local staging database on loopback; migrations applied; email, AI, payments and worker dispatch remain disabled.");
