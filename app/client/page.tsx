import { ClientSectionPage } from '@/components/webfactory/v2/client/section';
export const metadata = { title: 'Client overview', robots: { index: false, follow: false } };
export default function Page() { return <ClientSectionPage section="overview" />; }
