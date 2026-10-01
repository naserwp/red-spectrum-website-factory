import { notFound } from 'next/navigation';
import { ClientShell, V2Intro } from '@/components/webfactory/v2/shell';
import { ProjectStatusCard } from '@/components/webfactory/v2/client/status-card';
import { getCustomerProject } from '@/lib/webfactory/project-data';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Client project', robots: { index: false, follow: false } };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const project = await getCustomerProject((await params).id);
  if (!project) notFound();
  return <ClientShell><V2Intro eyebrow="Private project" title={project.title} description="Live status of the request saved in this browser." /><section className="v2-container v2-section" style={{ paddingTop: 0 }}><ProjectStatusCard project={project} detail /></section></ClientShell>;
}
