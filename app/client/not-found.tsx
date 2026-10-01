import Link from 'next/link';
import { ClientShell, V2Intro } from '@/components/webfactory/v2/shell';
export default function NotFound() { return <ClientShell><V2Intro eyebrow="Client access" title="Project unavailable" description="This project is not available to the request saved in this browser." /><div className="v2-container"><Link className="v2-button v2-quiet" href="/client/projects">Your projects ↗</Link></div></ClientShell>; }
