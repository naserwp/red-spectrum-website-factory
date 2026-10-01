import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ClientShell, V2Intro } from '../shell';
import { ProjectStatusCard } from './status-card';
import { getCustomerProjects } from '@/lib/webfactory/project-data';
import { leaveCustomerWorkspace } from '@/app/client/actions';

type ClientSection = 'overview' | 'projects' | 'messages' | 'files' | 'profile';
const pages: Record<ClientSection, { title: string; description: string }> = {
  overview: { title: 'Your website workspace', description: 'Your saved request in this browser.' },
  projects: { title: 'Projects', description: 'Current status from your WebFactory request.' },
  messages: { title: 'Messages', description: 'Private messaging is not connected.' },
  files: { title: 'Files & delivery', description: 'Private uploads and downloads are unavailable.' },
  profile: { title: 'Your profile', description: 'Account editing requires verified permanent customer authentication.' },
};
export async function ClientSectionPage({ section }: { section: ClientSection }) {
  let projects;
  try { projects = await getCustomerProjects(); }
  catch (error) { if (error && typeof error === 'object' && 'digest' in error) throw error; return <ClientShell><V2Intro eyebrow="Client access" title="Project temporarily unavailable" description="Storage could not be reached. Please try again later." /></ClientShell>; }
  if (!projects.length) redirect('/client/login');
  const page = pages[section];
  return <ClientShell><V2Intro eyebrow="Private request access" title={page.title} description={page.description} /><section className="v2-container v2-section" style={{ paddingTop: 0 }}>
    {(section === 'overview' || section === 'projects') && <div className="v2-two"><ProjectStatusCard project={projects[0]} /><aside className="v2-card"><h3>Next steps</h3><p className="v2-muted">This access is limited to the request submitted in this browser. It expires with the existing request cookie and does not create a permanent account.</p><Link href="/processing" className="v2-button v2-quiet">How the process works ↗</Link><form action={leaveCustomerWorkspace}><button className="v2-button v2-quiet">Leave this workspace</button></form></aside></div>}
    {section === 'messages' && <div className="v2-card"><h2>Project conversation</h2><p className="v2-muted">No customer-visible message service is connected. Use your existing contact channel to speak with the team.</p><textarea disabled aria-label="Message unavailable" placeholder="Messaging unavailable" /><button className="v2-button" disabled>Send unavailable</button></div>}
    {section === 'files' && <div className="v2-card"><h2>Project files</h2><p className="v2-muted">No verified private delivery package or upload service is connected.</p><Link className="v2-button v2-quiet" href="/client/delivery/current">Delivery status ↗</Link></div>}
    {section === 'profile' && <div className="v2-card"><h2>Account connection pending</h2><p className="v2-muted">This browser can read its saved request status. Profile editing and permanent customer accounts are unavailable.</p><button className="v2-button" disabled>Save profile unavailable</button></div>}
  </section></ClientShell>;
}
