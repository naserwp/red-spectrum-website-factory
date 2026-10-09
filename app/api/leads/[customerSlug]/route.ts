import { customerDomainForHost } from "@/lib/customers/domains";
import { getCustomerSite } from "@/lib/customers/registry";
import { acceptWebsiteLead } from "@/lib/leads/service";
import { hasForbiddenDeliveryField, websiteLeadSchema, broomLeadSchema, lcLeadSchema, uniqueHomeLeadSchema, umgLeadSchema } from "@/lib/leads/validation";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ customerSlug: string }> }) {
  const { customerSlug } = await params;
  const site = getCustomerSite(customerSlug);
  const reply = (body: { ok: boolean; message: string; saved?: boolean; duplicate?: boolean; leadId?: string }, options: { status?: number } = {}) => {
    if (customerSlug !== 'broom-home-enterprises-llc' || !request.headers.get('accept')?.includes('text/html')) return Response.json(body, options);
    const domain = customerDomainForHost(new URL(request.url).hostname);
    const root = domain?.slug === customerSlug && domain.status === 'verified' ? '' : '/' + customerSlug;
    const message = body.message.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
    return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Inquiry — Broom Home Enterprises LLC</title><style>body{margin:0;padding:60px 24px;background:#f6f2e9;color:#132238;font:18px/1.7 system-ui,sans-serif}main{max-width:600px;margin:auto}h1{font:48px/1.15 Georgia,serif}a{color:#745724;text-underline-offset:5px;display:inline-block;padding:12px 0}</style><main><p>Broom Home Enterprises LLC</p><h1>${body.ok ? 'Thank you.' : body.saved ? 'Your inquiry is saved.' : 'Let’s check your inquiry.'}</h1><p role="status">${message}</p><a href="${root}/contact">Return to contact page</a><br><a href="tel:+13476663929">Call (347) 666-3929</a></main></html>`, { status: options.status || 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' } });
  };
  if (!site) return reply({ ok: false, message: "Website not found." }, { status: 404 });
  const origin = request.headers.get("origin");
  if (customerSlug === 'unique-management-group' && (new URL(request.url).hostname !== 'preview.redspectrum.ai' || origin !== 'https://preview.redspectrum.ai')) return reply({ ok: false, message: 'Please submit from this website.' }, { status: 403 });
  if (origin) {
    let allowed = origin === new URL(request.url).origin;
    if (!allowed) {
      try { allowed = customerDomainForHost(new URL(origin).hostname)?.slug === customerSlug; } catch { allowed = false; }
    }
    if (!allowed) return reply({ ok: false, message: "Please submit from this website." }, { status: 403 });
  }
  if (Number(request.headers.get("content-length") || 0) > 24000) return reply({ ok: false, message: "Please shorten your inquiry." }, { status: 413 });

  let formData: FormData;
  try { formData = await request.formData(); } catch {
    return reply({ ok: false, message: "Please submit a valid form." }, { status: 400 });
  }
  const rawValues = Object.fromEntries(formData.entries());
  if ([...formData.values()].some(value => typeof value !== "string") || [...formData.keys()].length !== Object.keys(rawValues).length) return reply({ ok: false, message: "Please check the required fields." }, { status: 400 });
  if (hasForbiddenDeliveryField(rawValues)) return reply({ ok: false, message: "Please check the required fields." }, { status: 400 });
  const parsed = (customerSlug === 'broom-home-enterprises-llc' ? broomLeadSchema : customerSlug === 'unique-management-group' ? umgLeadSchema : customerSlug === "lc-real-estate" ? lcLeadSchema : customerSlug === "unique-home-enterprise" ? uniqueHomeLeadSchema : websiteLeadSchema).safeParse(rawValues);
  if (!parsed.success) return reply({ ok: false, message: "Please check the required fields." }, { status: 400 });
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  try {
    const result = await acceptWebsiteLead(site, parsed.data, clientIp);
    if (result.state === "inactive" || result.state === "unconfigured") return reply({ ok: false, message: "Form delivery is not active." }, { status: 503 });
    if (result.state === "rate_limited") return reply({ ok: false, message: "Please wait before submitting another request." }, { status: 429 });
    if (result.state === "notification_pending") return reply({ ok: false, saved: true, leadId: result.leadId, message: "Your inquiry was saved, but notification has not been confirmed. Please do not resubmit; contact us directly if urgent." }, { status: 503 });
    if (result.state === "duplicate") return reply({ ok: true, duplicate: true, leadId: result.leadId, message: "We already received this request. Please wait before sending it again." });
    return reply({ ok: true, leadId: result.leadId, message: customerSlug === "broom-home-enterprises-llc" ? "Thank you. Your inquiry has been received. The team can respond using the contact details you provided." : customerSlug === "unique-home-enterprise"
      ? "Thank you. Your inquiry has been received."
      : customerSlug === "lc-real-estate"
      ? "Thank you. Your inquiry has been received. A member of the team will follow up with you."
      : "Your inquiry was saved and its notification accepted for processing. This does not confirm inbox delivery, an appointment or investment approval." });
  } catch {
    return reply({ ok: false, message: "The request could not be accepted. Please try again later." }, { status: 503 });
  }
}
