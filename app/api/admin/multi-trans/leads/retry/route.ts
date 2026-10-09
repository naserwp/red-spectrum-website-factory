import { isAdmin } from '@/lib/webfactory/server';
import { mtgCommunicationConfig } from '@/lib/leads/mtg-config';
import { MtgLeadService, mtgPool } from '@/lib/leads/mtg-service';
import { z } from 'zod';

export async function POST(request: Request) {
  if (!await isAdmin()) return Response.json({ ok: false }, { status: 401 });
  if (request.headers.get('origin') !== new URL(request.url).origin) return Response.json({ ok: false }, { status: 403 });
  const body = z.object({ leadId: z.string().uuid() }).strict().safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ ok: false }, { status: 400 });
  const service = new MtgLeadService(mtgPool(), mtgCommunicationConfig());
  await service.deliver(body.data.leadId);
  return Response.json({ ok: true, ...await service.status(body.data.leadId) }, { headers: { 'Cache-Control': 'no-store' } });
}
