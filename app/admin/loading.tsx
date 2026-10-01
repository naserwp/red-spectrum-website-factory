import { AdminShell, V2Intro } from '@/components/webfactory/v2/shell';
export default function Loading() { return <AdminShell><V2Intro eyebrow="Admin workspace" title="Loading current projects" description="Reading the latest workflow state." /><div className="v2-container v2-notice" role="status">Please wait…</div></AdminShell>; }
