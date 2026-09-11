import assert from "node:assert/strict";
import { notificationHtml, notificationText } from "../lib/leads/email.ts";
import { hasForbiddenDeliveryField, leadDedupeKey, websiteLeadSchema } from "../lib/leads/validation.ts";

const lead = websiteLeadSchema.parse({
  name: "Synthetic <visitor>",
  email: "visitor@example.com",
  phone: "2255550100",
  service: "Transportation inquiry",
  message: "<script>not executable</script>",
  consent: "on",
  botcheck: "",
});
const receivedAt = new Date("2026-09-12T00:00:00.000Z");
assert.equal(hasForbiddenDeliveryField({ recipient: "attacker@example.com" }), true);
assert.equal(hasForbiddenDeliveryField({ mode: "live" }), true);
assert.equal(hasForbiddenDeliveryField({ company: "Legitimate optional field" }), false);
assert.equal(leadDedupeKey("swenzy-logistics", lead, receivedAt), leadDedupeKey("swenzy-logistics", lead, receivedAt));
assert.notEqual(leadDedupeKey("swenzy-logistics", lead, receivedAt), leadDedupeKey("another-customer", lead, receivedAt));
const stored = { leadId: "11111111-1111-1111-1111-111111111111", customerSlug: "swenzy-logistics", deliveryMode: "test", notificationStatus: "pending", attemptCount: 1, recipientEmail: "internal@example.com", visitorName: lead.name, visitorEmail: lead.email, visitorPhone: lead.phone, requestedService: lead.service, message: lead.message, receivedAt };
assert.ok(notificationHtml(stored).includes("&lt;script&gt;not executable&lt;/script&gt;"));
assert.ok(!notificationHtml(stored).includes("<script>not executable</script>"));
assert.ok(notificationText(stored).includes("11111111-1111-1111-1111-111111111111"));
console.log("Passed SendGrid lead validation, customer-scoped dedupe and HTML escaping assertions.");
