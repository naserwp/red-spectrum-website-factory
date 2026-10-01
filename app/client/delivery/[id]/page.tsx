import { notFound } from 'next/navigation';
import { ClientShell, V2Intro } from '@/components/webfactory/v2/shell';
import { getCustomerProject } from '@/lib/webfactory/project-data';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Client delivery', robots: { index: false, follow: false } };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const project = await getCustomerProject((await params).id);
  if (!project) notFound();
  return <ClientShell><V2Intro eyebrow="Private delivery" title={`${project.title} delivery`} description="Current delivery availability for your project." /><section className="v2-container v2-section" style={{ paddingTop: 0 }}><div className="v2-card"><span className="v2-badge">Unavailable</span><h2>Private handoff pending</h2><p className="v2-muted">No verified customer delivery package is connected. Approval and payment do not automatically publish a site.</p><button className="v2-button" disabled>Download unavailable</button></div></section></ClientShell>;
}
