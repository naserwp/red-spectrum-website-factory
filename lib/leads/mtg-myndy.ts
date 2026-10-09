import 'server-only';

const base = 'https://hello.myndy.ai/api/public/v1';
const workspace = '69fe0055f0de00208466235b';
type Result = { state: string; receipt?: string; error?: string; verified?: boolean; retryAfter?: number };
const record = (value: unknown): Record<string, unknown> => value && typeof value === 'object' ? value as Record<string, unknown> : {};
const retrySeconds = (response: Response) => {
  const value = response.headers.get('retry-after');
  const seconds = value && /^\d+$/.test(value) ? Number(value) : value ? Math.ceil((Date.parse(value) - Date.now()) / 1000) : 120;
  return Number.isFinite(seconds) ? Math.max(120, seconds) : 120;
};
/** Provider docs: https://myndy.ai/docs/communications-api; webhook contract supplied by customer. */
export async function createMtgMyndyContact(key: string, input: { name: string; email: string; phone?: string; company_name?: string; notes: string[]; tags: string[] }): Promise<Result> {
  const headers = { 'X-API-Key': key, 'Content-Type': 'application/json' };
  // Check authenticated ownership before transmitting any visitor data.
  const identity = await fetch(`${base}/me`, { headers, signal: AbortSignal.timeout(10000) });
  if (!identity.ok) return { state: identity.status === 429 ? 'retryable' : 'failed', error: `myndy_identity_${identity.status}`, retryAfter: retrySeconds(identity) };
  const owner = record(await identity.json());
  if (owner.workspace_id !== workspace || owner.user_id !== workspace || !Array.isArray(owner.scopes) || !['contacts:read', 'contacts:write'].every(scope => (owner.scopes as unknown[]).includes(scope))) return { state: 'failed', error: 'myndy_tenant_or_scope_mismatch' };
  // No message field: saving a contact must never send SMS or create an inbound conversation.
  const response = await fetch('https://hello.myndy.ai/api/webhooks/contacts', { method: 'POST', headers, body: JSON.stringify(input), signal: AbortSignal.timeout(10000) });
  if (!response.ok) return { state: response.status === 429 ? 'retryable' : response.status >= 500 ? 'uncertain' : 'failed', error: `myndy_${response.status}`, retryAfter: retrySeconds(response) };
  const body = record(await response.json().catch(() => ({})));
  const nested = record(body.contact);
  const id = [body.contact_id, body.id, nested.contact_id, nested.id].find(value => typeof value === 'string') as string | undefined;
  if (!id || id.length > 200) return { state: 'accepted', error: 'myndy_readback_id_missing' };
  // A read failure must never cause a second creation request.
  try {
    const read = await fetch(`${base}/contacts/${encodeURIComponent(id)}`, { headers, signal: AbortSignal.timeout(10000) });
    if (!read.ok) return { state: 'accepted', receipt: id, error: `myndy_readback_${read.status}` };
    const raw = record(await read.json());
    const contact = raw.contact ? record(raw.contact) : raw;
    const verified = contact.contact_id === id && contact.workspace_id === workspace && contact.email === input.email && Array.isArray(contact.tags) && contact.tags.includes('multi-trans-global-logistics');
    return { state: 'accepted', receipt: id, verified, ...(verified ? {} : { error: 'myndy_readback_mismatch' }) };
  } catch { return { state: 'accepted', receipt: id, error: 'myndy_readback_unavailable' }; }
}
