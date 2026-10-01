'use client';
import Link from 'next/link';
import { ClientShell, V2Intro } from '@/components/webfactory/v2/shell';
export default function Error({ reset }: { error: Error; reset: () => void }) { return <ClientShell><V2Intro eyebrow="Client access" title="Project temporarily unavailable" description="We could not load your project right now." /><div className="v2-container v2-actions"><button className="v2-button v2-red" onClick={reset}>Try again</button><Link className="v2-button v2-quiet" href="/client/login">Client access ↗</Link></div></ClientShell>; }
