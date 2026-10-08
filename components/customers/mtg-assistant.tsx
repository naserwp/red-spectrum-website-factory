"use client";
import { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { CustomerMyndy } from './customer-myndy';

const subscribe = () => () => {};
const agent = 'agent_1791499171_dFkdItb29IQasjpC9SdkgA';
export function MtgAssistant({ enabled, agentId }: { enabled: boolean; agentId: string }) {
  const [explain, setExplain] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const [formVisible, setFormVisible] = useState(false);
  useEffect(() => {
    const form = document.querySelector('[data-mtg-lead]');
    if (!form) return;
    const observer = new IntersectionObserver(entries => setFormVisible(entries.some(entry => entry.isIntersecting)));
    observer.observe(form);
    return () => observer.disconnect();
  }, []);
  if (!enabled || agentId !== agent || !/^agent_[A-Za-z0-9_]+$/.test(agentId)) return null;
  if (loaded) return <div className="mtg-widget-shell" style={{ visibility: formVisible ? 'hidden' : undefined }}><CustomerMyndy agentId={agentId} accent="#101B2B" label="Open Multi Trans Freight Assistant" /></div>;
  return <aside data-mtg-ready={mounted} style={{ visibility: formVisible ? 'hidden' : undefined }} className="mtg-assistant-launch" aria-label="Multi Trans AI assistant">
    {explain && <div className="mtg-assistant-consent" id="mtg-ai-disclosure"><strong>Multi Trans Freight Assistant</strong><p>Loading chat connects to Myndy. It may store conversation details and browser session information. AI answers do not confirm prices, bookings or message delivery. Contact synchronization is not yet verified.</p><Link href="/multi-trans-global-logistics/privacy">Read privacy notice</Link><button type="button" className="mtg-button" onClick={() => setLoaded(true)}>Load AI assistant</button><button type="button" onClick={() => setExplain(false)}>Cancel</button></div>}
    <button disabled={!mounted} type="button" className="mtg-button" aria-expanded={explain} aria-controls="mtg-ai-disclosure" onClick={() => setExplain(!explain)}>Freight assistant <span aria-hidden="true">↗</span></button>
  </aside>;
}

