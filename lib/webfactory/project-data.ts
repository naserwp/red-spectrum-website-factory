import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { database, digest, isAdmin, secureEqual } from './server';
import { mapAdminProjectStatus, mapProjectStatus, type AdminProjectStatus, type ProjectStatus, type ProjectStatusSource } from './project-status';

export type CustomerSession = { requestId: string; business: string; accessHash: string };
const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const keyPattern = /^[0-9a-f]{64}$/;
export function parseRequestAccessToken(token: string | undefined): { id: string; key: string } | null {
  if (!token || token.length > 128) return null;
  const parts = token.split('.');
  return parts.length === 2 && idPattern.test(parts[0]) && keyPattern.test(parts[1]) ? { id: parts[0], key: parts[1] } : null;
}
export async function currentCustomerSession(): Promise<CustomerSession | null> {
  const parsed = parseRequestAccessToken((await cookies()).get('wf_request')?.value);
  if (!parsed) return null;
  const result = await database().query<{ id: string; business: string; access_hash: string }>(
    'SELECT id,business,access_hash FROM webfactory.requests WHERE id=$1', [parsed.id]);
  const row = result.rows[0];
  return row && secureEqual(digest(parsed.key), row.access_hash) ? { requestId: row.id, business: row.business, accessHash: row.access_hash } : null;
}
export async function requireCustomerSession(): Promise<CustomerSession> {
  const session = await currentCustomerSession();
  if (!session) redirect('/client/login');
  return session;
}
const projectSelect = `SELECT r.id,r.business,r.status,r.customer_slug,r.created_at,GREATEST(r.updated_at,COALESCE(w.updated_at,r.updated_at),COALESCE(j.finished_at,j.created_at,r.updated_at),COALESCE(v.created_at,r.updated_at)) AS updated_at,
  w.stage,w.preview_url,b.status AS brief_status,j.status AS build_status,v.review_status
  FROM webfactory.requests r
  LEFT JOIN webfactory.build_workflows w ON w.request_id=r.id
  LEFT JOIN webfactory.ai_briefs b ON b.id=w.active_brief_id
  LEFT JOIN LATERAL (SELECT status,created_at,finished_at FROM webfactory.website_build_jobs WHERE request_id=r.id ORDER BY created_at DESC LIMIT 1) j ON true
  LEFT JOIN LATERAL (SELECT review_status,created_at FROM webfactory.request_review_events WHERE request_id=r.id AND kind='review' ORDER BY created_at DESC LIMIT 1) v ON true`;
export async function getCustomerProjects(): Promise<ProjectStatus[]> {
  const session = await requireCustomerSession();
  const result = await database().query<ProjectStatusSource>(`${projectSelect} WHERE r.id=$1 AND r.access_hash=$2`, [session.requestId, session.accessHash]);
  return result.rows.map(mapProjectStatus);
}
export async function getCustomerProject(id: string): Promise<ProjectStatus | null> {
  if (id !== 'current') return null;
  return (await getCustomerProjects())[0] ?? null;
}
export async function getAdminProjects(): Promise<AdminProjectStatus[]> {
  if (!await isAdmin()) redirect('/admin/login');
  const result = await database().query<ProjectStatusSource>(`${projectSelect} ORDER BY updated_at DESC`);
  return result.rows.map(mapAdminProjectStatus);
}
