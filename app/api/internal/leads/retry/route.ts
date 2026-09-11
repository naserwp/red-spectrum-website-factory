import { retryPendingLeadNotifications } from "@/lib/leads/service";

async function retry(request: Request) {
  const secret = process.env.LEADS_RETRY_CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return new Response(null, { status: 401 });
  try {
    return Response.json({ ok: true, ...(await retryPendingLeadNotifications(10)) });
  } catch {
    return Response.json({ ok: false, message: "Lead retry service is unavailable." }, { status: 503 });
  }
}

export const GET = retry;
export const POST = retry;
