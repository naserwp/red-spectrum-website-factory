import { cp, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const [slugInput, ...nameParts] = process.argv.slice(2);
const slug = slugInput?.toLowerCase();
const businessName = nameParts.join(" ").trim();
const reservedSlugs = new Set(["api", "brief", "standards", "templates", "_next"]);

if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || reservedSlugs.has(slug) || !businessName) {
  console.error('Usage: npm run customer:new -- <slug> "<Business Name>"');
  process.exit(1);
}

const root = process.cwd();
const source = path.join(root, "templates", "customer-package");
const target = path.join(root, "customers", slug);

try { await stat(target); console.error(`Customer folder already exists: ${target}`); process.exit(1); } catch (error) { if (error.code !== "ENOENT") throw error; }

await mkdir(path.dirname(target), { recursive: true });
await cp(source, target, { recursive: true, errorOnExist: true });

async function replaceTokens(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) await replaceTokens(filePath);
    else {
      const content = await readFile(filePath, "utf8");
      await writeFile(filePath, content.replaceAll("{{SLUG}}", slug).replaceAll("{{SLUG_ENV}}", slug.toUpperCase().replaceAll("-", "_")).replaceAll("{{BUSINESS_NAME}}", businessName));
    }
  }
}

await replaceTokens(target);
console.log(`Created customer package: ${target}`);
console.log("This package is not routable until its reviewed configuration is added to customers/manifest.json.");
