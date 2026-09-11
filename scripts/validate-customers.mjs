import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { customerManifestSchema } from "../lib/customers/schema.ts";

const root = process.cwd();
const manifestPath = path.join(root, "customers", "manifest.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const parsed = customerManifestSchema.parse(manifest);
const packageEntries = await readdir(path.join(root, "customers"), { withFileTypes: true });
const packageSlugs = new Set(packageEntries.filter((entry) => entry.isDirectory()).map((entry) => entry.name));

for (const customer of parsed.customers) {
  if (!packageSlugs.has(customer.slug)) throw new Error(`Registered customer is missing its delivery package: ${customer.slug}`);
}

console.log(`Validated ${parsed.customers.length} registered customer site(s) and ${packageSlugs.size} delivery package(s).`);
