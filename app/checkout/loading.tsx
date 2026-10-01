import { V2Shell, V2Intro } from '@/components/webfactory/v2/shell';
export default function Loading() { return <V2Shell><V2Intro eyebrow="Payment & review" title="Checking project access" description="Payment remains unavailable." /><div className="v2-container v2-notice" role="status">Please wait…</div></V2Shell>; }
