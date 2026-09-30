import { customerDomainForHost } from "@/lib/customers/domains";
import { getCustomerSite } from "@/lib/customers/registry";
import { acceptWebsiteLead } from "@/lib/leads/service";
import { hasForbiddenDeliveryField, websiteLeadSchema, lcLeadSchema, uniqueHomeLeadSchema, umgLeadSchema } from "@/lib/leads/validation";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ customerSlug: string }> }) {
  const { customerSlug } = await params;
  const site = getCustomerSite(customerSlug);
  if (!site) return Response.json({ ok: false, message: "Website not found." }, { status: 404 });
  const origin = request.headers.get("origin");
  if (customerSlug === 'unique-management-group' && (new URL(request.url).hostname !== 'preview.redspectrum.ai' || origin !== 'https://preview.redspectrum.ai')) return Response.json({ ok: false, message: 'Please submit from this website.' }, { status: 403 });
  if (origin) {
    let allowed = origin === new URL(request.url).origin;
    if (!allowed) {
      try { allowed = customerDomainForHost(new URL(origin).hostname)?.slug === customerSlug; } catch { allowed = false; }
    }
    if (!allowed) return Response.json({ ok: false, message: "Please submit from this website." }, { status: 403 });
  }
  if (Number(request.headers.get("content-length") || 0) > 24000) return Response.json({ ok: false, message: "Please shorten your inquiry." }, { status: 413 });

  let formData: FormData;
  try { formData = await request.formData(); } catch {
    return Response.json({ ok: false, message: "Please submit a valid form." }, { status: 400 });
  }
  const rawValues = Object.fromEntries(formData.entries());
  if ([...formData.values()].some(value => typeof value !== "string") || [...formData.keys()].length !== Object.keys(rawValues).length) return Response.json({ ok: false, message: "Please check the required fields." }, { status: 400 });
  if (hasForbiddenDeliveryField(rawValues)) return Response.json({ ok: false, message: "Please check the required fields." }, { status: 400 });
  const parsed = (customerSlug === 'unique-management-group' ? umgLeadSchema : customerSlug === "lc-real-estate" ? lcLeadSchema : customerSlug === "unique-home-enterprise" ? uniqueHomeLeadSchema : websiteLeadSchema).safeParse(rawValues);
  if (!parsed.success) return Response.json({ ok: false, message: "Please check the required fields." }, { status: 400 });
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  try {
    const result = await acceptWebsiteLead(site, parsed.data, clientIp);
    if (result.state === "inactive" || result.state === "unconfigured") return Response.json({ ok: false, message: "Form delivery is not active." }, { status: 503 });
    if (result.state === "rate_limited") return Response.json({ ok: false, message: "Please wait before submitting another request." }, { status: 429 });
    if (result.state === "notification_pending") return Response.json({ ok: false, saved: true, leadId: result.leadId, message: "Your inquiry was saved, but notification has not been confirmed. Please do not resubmit; contact us directly if urgent." }, { status: 503 });
    if (result.state === "duplicate") return Response.json({ ok: true, duplicate: true, leadId: result.leadId, message: "We already received this request. Please wait before sending it again." });
    return Response.json({ ok: true, leadId: result.leadId, message: customerSlug === "unique-home-enterprise"
      ? "Thank you. Your inquiry has been received."
      : customerSlug === "lc-real-estate"
      ? "Thank you. Your inquiry has been received. A member of the team will follow up with you."
      : "Your inquiry was saved and its notification accepted for processing. This does not confirm inbox delivery, an appointment or investment approval." });
  } catch {
    return Response.json({ ok: false, message: "The request could not be accepted. Please try again later." }, { status: 503 });
  }
}
