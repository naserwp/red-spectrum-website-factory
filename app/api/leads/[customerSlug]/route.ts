import { getCustomerSite } from "@/lib/customers/registry";
import { acceptWebsiteLead } from "@/lib/leads/service";
import { hasForbiddenDeliveryField, websiteLeadSchema } from "@/lib/leads/validation";

export async function POST(request: Request, { params }: { params: Promise<{ customerSlug: string }> }) {
  const { customerSlug } = await params;
  const site = getCustomerSite(customerSlug);
  if (!site) return Response.json({ ok: false, message: "Website not found." }, { status: 404 });

  let formData: FormData;
  try { formData = await request.formData(); } catch {
    return Response.json({ ok: false, message: "Please submit a valid form." }, { status: 400 });
  }
  const rawValues = Object.fromEntries(formData.entries());
  if (hasForbiddenDeliveryField(rawValues)) return Response.json({ ok: false, message: "Please check the required fields." }, { status: 400 });
  const parsed = websiteLeadSchema.safeParse(rawValues);
  if (!parsed.success) return Response.json({ ok: false, message: "Please check the required fields." }, { status: 400 });
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  try {
    const result = await acceptWebsiteLead(site, parsed.data, clientIp);
    if (result.state === "inactive" || result.state === "unconfigured") return Response.json({ ok: false, message: "Form delivery is not active." }, { status: 503 });
    if (result.state === "rate_limited") return Response.json({ ok: false, message: "Please wait before submitting another request." }, { status: 429 });
    if (result.state === "duplicate") return Response.json({ ok: true, duplicate: true, leadId: result.leadId, message: "We already received this request. Please wait before sending it again." });
    return Response.json({ ok: true, leadId: result.leadId, pendingNotification: result.state === "accepted_pending_retry", message: "Your inquiry was accepted for processing. This does not confirm a booking." });
  } catch {
    return Response.json({ ok: false, message: "The request could not be accepted. Please try again later." }, { status: 503 });
  }
}
