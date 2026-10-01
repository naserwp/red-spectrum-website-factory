import { AdminSection } from '@/components/webfactory/v2/admin/section';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin settings', robots: { index: false, follow: false } };
export default function Page() { return <AdminSection section="settings" />; }
