import Link from 'next/link';
import { getAdminProjects } from '@/lib/webfactory/project-data';
import { logout } from '@/app/webfactory-actions';
import { AdminShell, V2Intro } from '@/components/webfactory/v2/shell';
export const metadata = { title: 'Admin Dashboard', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';
export default async function Page() {
  let projects;
  try { projects = await getAdminProjects(); }
  catch (error) { if (error && typeof error === 'object' && 'digest' in error) throw error; projects = null; }
  return <AdminShell><V2Intro eyebrow="Admin workspace" title="From request to ready." description="Live project status from the existing WebFactory workflow." /><section className="v2-container v2-section" style={{ paddingTop: 0 }}><div className="v2-actions"><Link className="v2-button v2-red" href="/admin/requests">All requests ↗</Link><Link className="v2-button v2-quiet" href="/admin/ai">AI workspace ↗</Link><form action={logout}><button className="v2-button v2-quiet">Sign out</button></form></div>{projects === null ? <div className="v2-notice" role="status">Request storage is unavailable. No project data was loaded.</div> : projects.length === 0 ? <div className="v2-empty">No customer requests have been received yet.</div> : <div className="v2-grid" style={{ marginTop: 25 }}>{projects.map(project => <article className="v2-card" key={project.id}><span className="v2-badge">{project.stageLabel}</span><h2 style={{ margin: '15px 0' }}>{project.title}</h2><p className="v2-muted">Request {project.id} · {project.customerSlug || 'Slug pending'}</p><p>Brief: {project.briefStatus} · Build: {project.buildStatus}</p><p>Preview: {project.previewAvailable ? 'Ready' : 'Pending'} · Approval: {project.approval.replaceAll('_', ' ')}</p><p>Delivery: {project.delivery} · Updated {project.updatedAt.slice(0, 10)}</p><Link className="v2-button v2-quiet" href={`/admin/requests/${project.id}`}>Open protected workflow ↗</Link></article>)}</div>}</section></AdminShell>;
}
