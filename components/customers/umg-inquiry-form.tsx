"use client";

import { useEffect, useRef, useState } from 'react';
import { umgServices } from '@/lib/customers/umg-services';

export function UmgInquiryForm({ root }: { root: string }) {
  const busy = useRef(false);
  const inquiry = useRef<HTMLSelectElement>(null);
  useEffect(() => {
    const selected = new URLSearchParams(window.location.search).get('service');
    if (inquiry.current && selected && umgServices.some(s => s.name === selected)) inquiry.current.value = selected;
  }, []);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    busy.current = true; setSending(true); setError('');
    try {
      const response = await fetch('/api/leads/unique-management-group', { method: 'POST', body: new FormData(event.currentTarget) });
      const body = await response.json() as { ok?: boolean; saved?: boolean };
      if (!response.ok || body.ok !== true) throw new Error(body.saved ? 'saved' : 'failed');
      window.location.assign(`${root}/thank-you`);
    } catch (cause) {
      setError(cause instanceof Error && cause.message === 'saved' ? 'Your inquiry is saved, but its notification is pending. Please contact us directly rather than resubmitting.' : 'We could not send your inquiry. Please check the fields and try again, or contact us directly.');
      busy.current = false; setSending(false);
    }
  }
  return <form onSubmit={submit}>
    <label htmlFor="umg-name">Name<input id="umg-name" name="name" autoComplete="name" required minLength={2} maxLength={100}/></label>
    <label htmlFor="umg-email">Email<input id="umg-email" name="email" type="email" autoComplete="email" required maxLength={200}/></label>
    <label htmlFor="umg-phone">Phone<input id="umg-phone" name="phone" type="tel" autoComplete="tel" required minLength={7} maxLength={40}/></label>
    <label htmlFor="umg-company">Company (optional)<input id="umg-company" name="company" autoComplete="organization" maxLength={160}/></label>
    <label htmlFor="umg-service">Inquiry type / service<select ref={inquiry} id="umg-service" name="service" required defaultValue=""><option value="">Choose an inquiry type</option>{umgServices.map(s => <option key={s.slug}>{s.name}</option>)}<option>General Consulting Inquiry</option></select></label>
    <label htmlFor="umg-message">Message<textarea id="umg-message" name="message" rows={5} required minLength={5} maxLength={2800}/></label>
    <div className="umg-honeypot" aria-hidden="true"><label>Leave empty<input name="botcheck" tabIndex={-1} autoComplete="off"/></label></div>
    <label className="umg-consent"><input name="consent" type="checkbox" required/>I agree to be contacted about this inquiry and have read the privacy notice.</label>
    <button type="submit" disabled={sending}>{sending ? 'Sending…' : 'Send inquiry'} <span aria-hidden="true">↗</span></button>
    {error && <p className="umg-form-error" role="alert">{error}</p>}
  </form>;
}
