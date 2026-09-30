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
  const notes = ["Captured from uniquehomeenterprise.com", `Inquiry area: ${lead.requestedService}`, `Message: ${lead.message}`];
  const response = await fetch("https://hello.myndy.ai/api/webhooks/contacts", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
    body: JSON.stringify({
      name: lead.visitorName,
      ...(lead.visitorEmail?.trim() ? { email: lead.visitorEmail.trim() } : {}),
      ...(lead.visitorPhone?.trim() ? { phone: lead.visitorPhone.trim() } : {}),
      notes,
      tags: ["website", "unique-home-enterprise"],
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    if (response.status === 422) {
      const body = await response.json().catch(() => null) as { detail?: unknown } | null;
      // Never persist provider messages, input values, or arbitrary response text.
      const allowedFields = new Set(["name", "phone", "phone_number", "email", "company_name", "notes", "tags", "message"]);
      const allowedTypes = new Set(["missing", "list_type", "string_type", "string_too_short", "string_too_long", "value_error", "extra_forbidden"]);
      const fields = Array.isArray(body?.detail) ? body.detail.flatMap((item: unknown) => {
        if (!item || typeof item !== "object") return [];
        const { type, loc } = item as { type?: unknown; loc?: unknown };
        if (typeof type !== "string" || !allowedTypes.has(type) || !Array.isArray(loc)) return [];
        const field = loc.find((part: unknown) => typeof part === "string" && allowedFields.has(part));
        return field ? [`${field}_${type}`] : [];
      }).slice(0, 5).join("__") : "";
      if (fields) throw new Error(`myndy_422_${fields}`);
    }
    throw new Error(`myndy_${response.status}`);
  }
}

export function safeMyndyError(error: unknown) {
  const message = error instanceof Error ? error.message : "myndy_unavailable";
  return /^myndy_(?:\d{3}|422_[a-z_]{1,200}|unconfigured|tenant_mismatch|unavailable)$/.test(message) ? message : "myndy_unavailable";
}
