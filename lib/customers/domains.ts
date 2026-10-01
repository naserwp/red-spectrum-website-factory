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
  "uniquemanagementgroup.com": { slug: "unique-management-group", canonicalHost: "uniquemanagementgroup.com", status: "attached" },
  "www.uniquemanagementgroup.com": { slug: "unique-management-group", canonicalHost: "uniquemanagementgroup.com", status: "attached" },
};

export function customerDomainForHost(host: string) {
  const normalized = host.trim().toLowerCase().replace(/:\d+$/, "").replace(/\.+$/, "");
  return customerDomains[normalized];
}

export function canonicalCustomerUrl(slug: string) {
  const host = Object.values(customerDomains).find((domain) => domain.slug === slug)?.canonicalHost;
  return host ? `https://${host}` : null;
}

// Only an exact canonical customer origin counts. Preview-host slug URLs stay separate.
export function slugFromCanonicalCustomerUrl(value: string) {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || url.username || url.password || url.port || url.search || url.hash || url.pathname !== "/") return null;
    const domain = customerDomainForHost(url.hostname);
    return domain && url.hostname === domain.canonicalHost ? domain.slug : null;
  } catch {
    return null;
  }
}
