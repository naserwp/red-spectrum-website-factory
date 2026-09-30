import "server-only";

import type { StoredLead } from "./store";

const uniqueHomeSecretName = "MYNDY_API_KEY_UNIQUE_HOME";

export function myndyContactSyncConfigured(slug: string) {
  return slug === "unique-home-enterprise" && Boolean(process.env[uniqueHomeSecretName]?.trim());
}

export async function syncUniqueHomeContact(lead: StoredLead) {
  if (lead.customerSlug !== "unique-home-enterprise") throw new Error("myndy_tenant_mismatch");
  const apiKey = process.env[uniqueHomeSecretName]?.trim();
  if (!apiKey) throw new Error("myndy_unconfigured");
  const notes = [`Inquiry area: ${lead.requestedService}`, `Message: ${lead.message}`, `Lead: ${lead.leadId}`].join("\n");
  const response = await fetch("https://hello.myndy.ai/api/webhooks/contacts", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
    body: JSON.stringify({
      name: lead.visitorName,
      email: lead.visitorEmail,
      ...(lead.visitorPhone ? { phone: lead.visitorPhone } : {}),
      notes,
      tags: ["website", "unique-home-enterprise"],
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    if (response.status === 422) {
      const body = await response.json().catch(() => null) as { detail?: unknown } | null;
      const fields = Array.isArray(body?.detail) ? body.detail.flatMap((item: { type?: unknown; loc?: unknown }) =>
        item.type === "missing" && Array.isArray(item.loc) ? item.loc.filter((part: unknown) => typeof part === "string" && part !== "body" && /^[a-zA-Z_]{1,40}$/.test(part)) : [],
      ).slice(0, 5).join("_") : "";
      if (fields) throw new Error(`myndy_422_missing_${fields}`);
    }
    throw new Error(`myndy_${response.status}`);
  }
}

export function safeMyndyError(error: unknown) {
  const message = error instanceof Error ? error.message : "myndy_unavailable";
  return /^myndy_(?:\d{3}|422_missing_[a-zA-Z_]{1,200}|unconfigured|tenant_mismatch|unavailable)$/.test(message) ? message : "myndy_unavailable";
}
