import { mtgLeadSchema } from '@/lib/leads/mtg-validation';
import { mtgCommunicationConfig } from '@/lib/leads/mtg-config';
import { MtgLeadService, mtgPool } from '@/lib/leads/mtg-service';

export const runtime = 'nodejs';
export async function POST(request: Request) {
  const respond = (body: object, status: number) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
  if (request.headers.get('origin') !== new URL(request.url).origin) return respond({ ok: false, message: 'Please submit from this website.' }, 403);
  if (!request.headers.get('content-type')?.startsWith('application/json')) return respond({ ok: false, message: 'Please submit a valid inquiry.' }, 415);
  let input: unknown;
  try {
    const reader = request.body?.getReader(); if (!reader) return respond({ ok: false }, 400);
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > 16000) { await reader.cancel(); return respond({ ok: false, message: 'Please shorten your inquiry.' }, 413); } chunks.push(value); }
    input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch { return respond({ ok: false, message: 'Please check your inquiry.' }, 400); }
  const parsed = mtgLeadSchema.safeParse(input);
  if (!parsed.success) return respond({ ok: false, message: 'Check the required fields and contact consent.' }, 400);
  try {
    const result = await new MtgLeadService(mtgPool(), mtgCommunicationConfig()).accept(parsed.data, request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown');
    if (result.state === 'inactive') return respond({ ok: false, message: 'Submission is not active. Please call or email the team.' }, 503);
    if (result.state === 'rate_limited') return respond({ ok: false, message: 'Please wait before submitting another inquiry.' }, 429);
    if (result.state === 'conflict') return respond({ ok: false, message: 'This submission reference was already used. Review your details and start a new inquiry.' }, 409);
    return respond({ ok: true, saved: true, leadId: result.leadId, duplicate: result.duplicate, notification: result.notification, myndy: result.myndy, message: result.duplicate ? 'This inquiry was already saved. Please do not resubmit.' : 'Your inquiry was saved. This does not confirm inbox delivery, a booking or Myndy contact synchronization.' }, 200);
  } catch { return respond({ ok: false, message: 'We could not confirm the submission. Retry with the same details, or contact the team directly.' }, 503); }
}
