import type { StoredLead } from "./store";

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function renderRows(lead: StoredLead) {
  return [
    ["Customer/site", lead.customerSlug === "lc-real-estate" ? "L&C Real Estate Investment Group" : lead.customerSlug === "unique-home-enterprise" ? "UNIQUE HOME ENTERPRISE LLC" : lead.customerSlug],
    ["Source", lead.customerSlug === "unique-home-enterprise" ? "uniquehomeenterprise.com" : `${lead.customerSlug} website`],
    ["Lead ID", lead.leadId], ["Received", lead.receivedAt.toISOString()], ["Name", lead.visitorName],
    ["Email", lead.visitorEmail], ["Phone", lead.visitorPhone], ["Requested service", lead.requestedService],
    ...(lead.investmentInterest ? [["Investment interest", lead.investmentInterest]] : []),
    ...(lead.budgetRange ? [["Budget range", lead.budgetRange]] : []),
    ...(lead.propertyType ? [["Preferred property type", lead.propertyType]] : []),
    ["Message", lead.message],
  ];
}

export function notificationText(lead: StoredLead) {
  return ["Red Spectrum website lead", ...renderRows(lead).map(([label, value]) => `${label}: ${value}`), "", "Reply to the visitor using the validated email above. Do not treat this notice as a booking confirmation."].join("\n");
}

export function notificationHtml(lead: StoredLead) {
  const rows = renderRows(lead).map(([label, value]) => `<tr><th style="padding:10px 12px;text-align:left;vertical-align:top;color:#475967;width:34%;border-bottom:1px solid #e5e7eb">${escapeHtml(label)}</th><td style="padding:10px 12px;white-space:pre-wrap;border-bottom:1px solid #e5e7eb">${escapeHtml(value)}</td></tr>`).join("");
  return `<!doctype html><html><body style="margin:0;background:#f5f6f8;font-family:Arial,sans-serif;color:#1f2937"><main style="max-width:640px;margin:24px auto;background:#fff;border:1px solid #e5e7eb"><header style="background:#1f2937;color:#fff;padding:24px"><div style="font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#32bfbd">Red Spectrum Leads</div><h1 style="margin:8px 0 0;font-size:25px">New website lead</h1></header><section style="padding:24px"><p style="margin:0 0 20px;line-height:1.5">A website inquiry was received. Reply using the validated visitor email below.</p><table role="presentation" style="border-collapse:collapse;width:100%;font-size:14px">${rows}</table><p style="margin:20px 0 0;color:#475967;font-size:12px">This notification is not a booking confirmation.</p></section></main></body></html>`;
}

export async function sendSendGridNotification(config: { apiKey: string; fromEmail: string; fromName: string }, input: { recipient: string; subject: string; lead: StoredLead }) {
  if (process.env.VERCEL_ENV === "preview") throw new Error("email_disabled");
  const enabled = input.lead.deliveryMode === "test" ? process.env.WEBFACTORY_INTERNAL_NOTIFICATIONS_ENABLED : process.env.WEBFACTORY_CUSTOMER_EMAILS_ENABLED;
  if (enabled !== "true") throw new Error("email_disabled");
  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: input.recipient }], subject: input.subject }],
      from: { email: config.fromEmail, name: config.fromName },
      reply_to: { email: input.lead.visitorEmail, name: input.lead.visitorName },
      content: [{ type: "text/plain", value: notificationText(input.lead) }, { type: "text/html", value: notificationHtml(input.lead) }],
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (response.status !== 202) throw new Error(`sendgrid_${response.status}`);
  return response.headers.get("x-message-id") ?? undefined;
}
