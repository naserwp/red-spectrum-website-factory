import { ClientShell, V2Intro } from '@/components/webfactory/v2/shell';
export default function Loading() { return <ClientShell><V2Intro eyebrow="Client access" title="Loading your project" description="Checking the request saved in this browser." /><div className="v2-container v2-notice" role="status">Please wait…</div></ClientShell>; }
