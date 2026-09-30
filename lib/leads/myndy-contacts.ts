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
  if (!response.ok) throw new Error(`myndy_${response.status}`);
}

export function safeMyndyError(error: unknown) {
  const message = error instanceof Error ? error.message : "myndy_unavailable";
  return /^myndy_(?:\d{3}|unconfigured|tenant_mismatch|unavailable)$/.test(message) ? message : "myndy_unavailable";
}
