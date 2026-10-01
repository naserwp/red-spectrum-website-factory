import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const production = "E:/Office/customer_Projects/rs-website-factory";
const staging = resolve(import.meta.dirname, "..");
const output = join(staging, "docs/production-reconciliation-inventory.json");
const git = (root, ...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
const hash = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");
const status = execFileSync("git", ["status", "--porcelain=v1", "-z", "--untracked-files=all"], { cwd: production }).toString("utf8").split("\0").filter(Boolean);
const copiedDocs = new Set([
  "docs/admin-preview-review.md", "docs/admin-slug-workflow.md", "docs/build-readiness-verification.md",
  "docs/lc-delivery-verification.md", "docs/lc-lead-activation.md",
]);

function classify(path) {
  if (path === "tsconfig.tsbuildinfo" || path.endsWith(".log") || path === "({src" || /\.(zip|pdf)$/.test(path) || /\/qa\/(?:local\/)?(?:.*\.(?:png|json|txt))$/.test(path) || path === "customers/jm-trucking-home-ported.png") return "GENERATED/BUILD ARTIFACT — DO NOT PORT";
  if (path.startsWith("public/customers/jm0616studio/") || path.startsWith("components/customers/jm0616-studio") || path.startsWith("customers/unique-management-group/research/") || path.startsWith("customers/unique-management-group/brief/")) return "OBSOLETE/CONFLICTING";
  if (path.startsWith("public/customers/") || path.startsWith("components/customers/") || /\/site\//.test(path) || path === "customers/manifest.json") return "REQUIRED CUSTOMER SITE/ASSET";
  if (path.startsWith("db/migrations/") || copiedDocs.has(path) || path.startsWith("customers/jm0616studio/") || path.startsWith("customers/lc-real-estate/delivery/") || path.startsWith("scripts/test-") || path.endsWith(".md") && !path.startsWith("docs/") || path === ".env.example") return "REQUIRED MIGRATION/TEST/DOC";
  if (path.startsWith("docs/") || path.startsWith("scripts/")) return "OBSOLETE/CONFLICTING";
  if (["app/admin/ai/page.tsx", "app/admin/login/page.tsx", "app/admin/requests/[id]/page.tsx", "app/checkout/page.tsx", "app/designs/page.tsx", "app/page.tsx", "app/privacy/page.tsx", "app/processing/page.tsx", "app/request/page.tsx", "components/webfactory/public-experience.css", "components/webfactory/shell.tsx"].includes(path)) return "NEEDS ADAPTATION TO V2";
  if (path.startsWith("app/") || path.startsWith("components/webfactory/") || path.startsWith("lib/") || path === "components/customer-website.tsx" || path === "package.json" || path === "tsconfig.json") return "REQUIRED BACKEND/WORKFLOW";
  return "OBSOLETE/CONFLICTING";
}

const files = status.map((entry) => {
  const statusCode = entry.slice(0, 2);
  const path = entry.slice(3).replaceAll("\\", "/");
  const source = join(production, path);
  const target = join(staging, path);
  const sourceHash = existsSync(source) && statSync(source).isFile() ? hash(source) : null;
  const targetHash = existsSync(target) && statSync(target).isFile() ? hash(target) : null;
  const identicalInStaging = sourceHash !== null && sourceHash === targetHash;
  const classification = classify(path);
  const disposition = classification === "GENERATED/BUILD ARTIFACT — DO NOT PORT" ? "excluded generated evidence" : identicalInStaging ? "already in staging or ported byte-for-byte" : path === "customers/jm0616studio/README.md" ? "ported with current staging status correction" : ["scripts/test-jm0616studio.mjs", "scripts/test-admin-reviews.mjs", "scripts/test-lc-leads.mjs"].includes(path) ? "adapted into current staging test" : path === "scripts/test-public-experience.mjs" ? "safety assertions adapted into test-v2-routes.mjs" : classification === "OBSOLETE/CONFLICTING" || targetHash === null ? "excluded obsolete or historical source" : "retained newer staging implementation";
  return { path, status: statusCode, classification, disposition, bytes: sourceHash ? statSync(source).size : null, sourceSha256: sourceHash, stagingSha256: targetHash, identicalInStaging };
});

const inventory = {
  productionHead: git(production, "rev-parse", "HEAD"),
  productionOriginMain: git(production, "rev-parse", "origin/main"),
  stagingHead: git(staging, "rev-parse", "HEAD"),
  files,
};
if (process.argv.includes("--verify")) {
  const before = JSON.parse(readFileSync(output, "utf8"));
  const changed = files.filter((file, i) => file.path !== before.files[i]?.path || file.sourceSha256 !== before.files[i]?.sourceSha256 || file.status !== before.files[i]?.status);
  if (files.length !== before.files.length || changed.length || inventory.productionHead !== before.productionHead) {
    console.error(`Production changed: ${changed.length} mismatched file(s), ${files.length} current vs ${before.files.length} original.`);
    process.exitCode = 1;
  } else console.log(`Production verified unchanged: ${files.length} modified/untracked file hashes and HEAD match.`);
} else {
  writeFileSync(output, `${JSON.stringify(inventory, null, 2)}\n`);
  const counts = Object.groupBy(files, (file) => file.classification);
  console.log(`${files.length} production modified/untracked files inventoried; ${files.filter((file) => file.identicalInStaging).length} already identical in staging.`);
  for (const [label, entries] of Object.entries(counts)) console.log(`${label}: ${entries.length}`);
}
