import manifestJson from "@/customers/manifest.json";
import { customerManifestSchema, type CustomerSite } from "@/lib/customers/schema";

const manifest = customerManifestSchema.parse(manifestJson);
const customerMap = new Map(manifest.customers.map((customer) => [customer.slug, customer]));

export function getCustomerSite(slug: string): CustomerSite | undefined {
  return customerMap.get(slug === 'broom-home-enterprises' ? 'broom-home-enterprises-llc' : slug);
}

export function getCustomerSites(): readonly CustomerSite[] {
  return manifest.customers;
}
