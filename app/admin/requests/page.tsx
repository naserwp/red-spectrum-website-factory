import { getAdminProjects } from '@/lib/webfactory/project-data';
import { AdminShell, V2Intro } from '@/components/webfactory/v2/shell';
import Link from 'next/link';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin requests', robots: { index: false, follow: false } };
export default async function Page() {
  let projects;
  try { projects = await getAdminProjects(); }
  catch (error) { if (error && typeof error === 'object' && 'digest' in error) throw error; projects = null; }
  return <AdminShell><V2Intro eyebrow="Private admin workspace" title="Customer requests" description="Current request, brief, build, preview and review states from WebFactory storage." /><section className="v2-container v2-section" style={{ paddingTop: 0 }}>{projects === null ? <div className="v2-notice" role="status">Request storage is unavailable.</div> : projects.length === 0 ? <div className="v2-empty">No customer requests have been received yet.</div> : <div className="v2-list">{projects.map(project => <Link href={`/admin/requests/${project.id}`} key={project.id}><div><strong>{project.title}</strong><div><small>{project.customerSlug || 'Slug pending'} · {project.stageLabel} · Updated {project.updatedAt.slice(0, 10)}</small></div><div><small>Brief {project.briefStatus} · Build {project.buildStatus} · Preview {project.previewAvailable ? 'ready' : 'pending'} · Approval {project.approval} · Delivery {project.delivery}</small></div></div><span className="v2-badge">{project.requestStatus}</span><span aria-hidden>↗</span></Link>)}</div>}</section></AdminShell>;
}
