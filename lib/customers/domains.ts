export type CustomerDomainRecord = {
  slug: string;
  canonicalHost: string;
  status: "attached" | "verified";
};

// Customer-owned domains are recorded here, rather than inferred from the
// Host header. Unknown hosts never select a tenant.
export const customerDomains: Record<string, CustomerDomainRecord> = {
  "uniquehomeenterprise.com": { slug: "unique-home-enterprise", canonicalHost: "uniquehomeenterprise.com", status: "attached" },
  "www.uniquehomeenterprise.com": { slug: "unique-home-enterprise", canonicalHost: "uniquehomeenterprise.com", status: "attached" },
};

export function customerDomainForHost(host: string) {
  const normalized = host.trim().toLowerCase().replace(/:\d+$/, "").replace(/\.+$/, "");
  return customerDomains[normalized];
}
