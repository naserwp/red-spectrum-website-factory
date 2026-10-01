import Link from 'next/link';
import { currentCustomerSession } from '@/lib/webfactory/project-data';
import { V2Shell } from '@/components/webfactory/v2/shell';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Client access', robots: { index: false, follow: false } };
export default async function Page() {
  let accessible = false, unavailable = false;
  try { accessible = Boolean(await currentCustomerSession()); } catch { unavailable = true; }
  return <V2Shell><section className="v2-container v2-login-grid"><div className="v2-login-story"><span className="v2-eyebrow">Red Spectrum / client experience</span><h1>Good work starts with a clear view.</h1><p>Follow the website request saved in this browser.</p></div><div className="v2-login-form"><h2>Your client workspace</h2>{accessible ? <><p>Your existing request access is active in this browser.</p><Link className="v2-button v2-red" href="/client">Open my project ↗</Link></> : <><p>Submit a request to receive private, browser-bound access to its status. Permanent customer sign-in is not available yet.</p><div className="v2-notice" role="status">{unavailable ? 'Request storage is temporarily unavailable.' : 'If you submitted from another browser or your access expired, contact the team. A name or email address alone cannot restore access.'}</div><Link className="v2-button v2-red" href="/request">Start a request ↗</Link></>}</div></section></V2Shell>;
}
