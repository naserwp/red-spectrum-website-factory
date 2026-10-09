"use client";
import { useRef, useState, type FormEvent } from 'react';
import { mtgBase } from '@/lib/customers/mtg-content';

type Mode = 'disabled' | 'test' | 'live';
export function MtgLeadForm({ source, mode, services }: { source: 'quote' | 'contact'; mode: Mode; services: readonly string[] }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ saved?: boolean; leadId?: string; message: string } | null>(null);
  const reference = useRef<string | null>(null);
  const fingerprint = useRef('');
  const locked = useRef(false);
  const status = useRef<HTMLDivElement>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (locked.current || mode === 'disabled') return;
    const form = new FormData(event.currentTarget);
    const values = Object.fromEntries(form.entries());
    const payload = { ...values, source, consent: form.get('consent') === 'on', syncConsent: form.get('syncConsent') === 'on' };
    const next = JSON.stringify(payload);
    if (fingerprint.current !== next) { reference.current = crypto.randomUUID(); fingerprint.current = next; }
    locked.current = true; setBusy(true); setResult(null);
    try {
      const response = await fetch('/api/leads/multi-trans-global-logistics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, idempotencyKey: reference.current }), signal: AbortSignal.timeout(45000) });
      const raw: unknown = await response.json();
      const data = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {}; 
      setResult({ saved: data.saved === true, leadId: typeof data.leadId === 'string' ? data.leadId : undefined, message: typeof data.message === 'string' ? data.message : 'Submission could not be confirmed. Please try again with the same details.' });
    } catch { setResult({ message: 'We could not confirm the result. Keep the same details and retry; the submission reference will be reused to prevent duplicates.' }); }
    finally { locked.current = false; setBusy(false); requestAnimationFrame(() => status.current?.focus()); }
  }
  return <div className="mtg-planner">
    <div className="mtg-notice"><strong>{mode === 'test' ? 'Internal test mode' : mode === 'disabled' ? 'Submission awaiting activation' : 'Send an inquiry to the team'}</strong>{mode === 'test' ? 'Synthetic tests notify the configured Red Spectrum test inbox only. They do not notify Multi Trans. Please do not enter real customer information during testing.' : mode === 'disabled' ? 'The form is prepared, but sending is not active. Call or email directly, or use the summary planner below.' : 'Your details are stored securely for inquiry handling. Email acceptance does not guarantee inbox delivery or confirm a booking.'}</div>
    <form data-mtg-lead={source} onSubmit={submit} onChange={() => { if(result?.saved) setResult(null); }}>
      <fieldset disabled={busy}><legend>Your contact details</legend><div className="mtg-fields">
        <label>Full name *<input name="name" autoComplete="name" minLength={2} maxLength={100} required /></label>
        <label>Company<input name="company" autoComplete="organization" maxLength={120} /></label>
        <label>Email *<input name="email" type="email" autoComplete="email" maxLength={200} required /></label>
        <label>Phone<input name="phone" type="tel" autoComplete="tel" maxLength={40} /></label>
        <label className="mtg-span">Freight type / inquiry *<select name="service" defaultValue="General freight inquiry"><option>General freight inquiry</option>{services.map(name => <option key={name}>{name}</option>)}</select></label>
        <label>Origin{source === 'quote' ? ' *' : ''}<input name="origin" maxLength={160} required={source === 'quote'} placeholder="City / state / ZIP" /></label>
        <label>Destination{source === 'quote' ? ' *' : ''}<input name="destination" maxLength={160} required={source === 'quote'} placeholder="City / state / ZIP" /></label>
        <label>Requested pickup date<input name="date" type="date" /></label>
        <label>Pallets / pieces<input name="pieces" maxLength={100} /></label>
        <label className="mtg-span">Approximate weight / dimensions<input name="size" maxLength={200} placeholder="Include units, e.g. lb and inches" /></label>
        <label className="mtg-span">Special instructions / message *<textarea name="details" minLength={5} maxLength={2000} rows={5} required /></label>
      </div><div className="mtg-honeypot" aria-hidden="true"><label>Leave empty<input name="botcheck" tabIndex={-1} autoComplete="off" /></label></div>
      <label className="mtg-consent"><input type="checkbox" name="consent" required /> <span>I agree that my contact and shipment details may be stored and used to respond to this inquiry, as described in the <a href={`${mtgBase}/privacy`}>privacy notice</a>. *</span></label>
      <label className="mtg-consent"><input type="checkbox" name="syncConsent" /> <span>Optional: I also consent to a Myndy contact record for this inquiry, if the dedicated connection is activated. Contact synchronization is not activated for public submissions.</span></label>
      <p className="mtg-fine">Do not include payment details or sensitive personal information. This is an inquiry, not a reservation.</p>
      <button className="mtg-button" type="submit" disabled={mode === 'disabled' || busy || result?.saved}>{busy ? 'Saving inquiry…' : result?.saved ? 'Inquiry saved' : mode === 'test' ? 'Send internal test inquiry' : 'Send inquiry'} <span aria-hidden="true">↗</span></button>
      </fieldset>
    </form>
    {result && <div className="mtg-notice" ref={status} tabIndex={-1} role="status"><strong>{result.saved ? 'Inquiry saved' : 'Submission not confirmed'}</strong>{result.message}{result.leadId && <p>Reference: <code>{result.leadId}</code></p>}</div>}
  </div>;
}
