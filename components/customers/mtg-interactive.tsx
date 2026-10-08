"use client";

import { useRef, useState } from 'react';
import { mtgBase, mtgServices } from '@/lib/customers/mtg-content';

const links = [['', 'Home'], ['about', 'About'], ['services', 'Services'], ['industries', 'Industries'], ['faq', 'FAQ'], ['contact', 'Contact']] as const;

export function MtgNavigation({ current }: { current: string }) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  return <div className="mtg-navigation" onKeyDown={event => { if (event.key === 'Escape') { setOpen(false); button.current?.focus(); } }}>
    <button ref={button} type="button" className="mtg-menu-toggle" aria-controls="mtg-navigation" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Close' : 'Menu'} <span aria-hidden="true">{open ? '×' : '☰'}</span></button>
    <nav id="mtg-navigation" aria-label="Main navigation" className={open ? 'is-open' : ''}>
      {links.map(([path, label]) => <a key={label} href={`${mtgBase}${path ? '/' + path : ''}`} aria-current={current === path ? 'page' : undefined} onClick={() => setOpen(false)}>{label}</a>)}
      <a className="mtg-button" href={`${mtgBase}/request-a-quote`}>Request a quote <span aria-hidden="true">↗</span></a>
    </nav>
  </div>;
}

export function MtgQuotePlanner() {
  const [summary, setSummary] = useState('');
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const result = useRef<HTMLDivElement>(null);
  return <div className="mtg-planner">
    <div className="mtg-notice"><strong>Prepare your freight inquiry.</strong> This preview does not submit requests. Create a summary below, then copy it or choose to open your email app.</div>
    <form onChange={() => { setSummary(''); setCopied(false); setCopyError(false); }} onSubmit={event => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const fields = [['Contact name', 'name'], ['Company', 'company'], ['Email', 'email'], ['Phone', 'phone'], ['Service', 'service'], ['Pickup city / state / ZIP', 'origin'], ['Delivery city / state / ZIP', 'destination'], ['Ready date', 'date'], ['Pallets / pieces', 'pieces'], ['Weight / dimensions', 'size'], ['Shipment details', 'details']];
      setSummary('Freight inquiry — Multi Trans Global Logistics INC\n\n' + fields.map(([label, key]) => `${label}: ${String(form.get(key) || 'Not supplied').trim()}`).join('\n') + '\n\nPlease review availability, scope and pricing. This is an inquiry, not a booking.');
      requestAnimationFrame(() => result.current?.focus());
    }}>
      <fieldset><legend><span>01</span> Your contact details</legend><div className="mtg-fields">
        <label>Contact name *<input name="name" autoComplete="name" required maxLength={100} /></label>
        <label>Company<input name="company" autoComplete="organization" maxLength={120} /></label>
        <label>Email *<input name="email" type="email" autoComplete="email" required maxLength={150} /></label>
        <label>Phone<input name="phone" type="tel" autoComplete="tel" maxLength={30} /></label>
      </div></fieldset>
      <fieldset><legend><span>02</span> Plan the movement</legend><div className="mtg-fields">
        <label className="mtg-span">Service<select name="service" defaultValue="Not sure — please advise"><option>Not sure — please advise</option>{mtgServices.map(service => <option key={service.slug}>{service.name}</option>)}</select></label>
        <label>Pickup city / state / ZIP *<input name="origin" required maxLength={150} /></label>
        <label>Delivery city / state / ZIP *<input name="destination" required maxLength={150} /></label>
        <label>Preferred ready date<input name="date" type="date" /></label>
        <label>Pallets / pieces<input name="pieces" maxLength={100} placeholder="e.g. 4 pallets" /></label>
        <label className="mtg-span">Weight / dimensions<input name="size" maxLength={200} placeholder="Include units, e.g. lb and inches" /></label>
        <label className="mtg-span">Shipment details *<textarea name="details" rows={5} required maxLength={1200} placeholder="Commodity, packaging, delivery window and any special handling needs" /></label>
      </div></fieldset>
      <p className="mtg-fine">Do not include payment details or sensitive information. Review our <a href={`${mtgBase}/privacy`}>privacy notice</a>. Availability and final terms require direct confirmation.</p>
      <button type="submit" className="mtg-button">Prepare inquiry summary <span aria-hidden="true">↗</span></button>
      <noscript><p>The planner needs JavaScript. You can call (773) 592-9382 or email mtglobal39@gmail.com directly.</p></noscript>
    </form>
    {summary && <div ref={result} tabIndex={-1} className="mtg-summary" role="region" aria-label="Prepared inquiry">
      <h2>Your inquiry is ready to review.</h2><p>Nothing has been sent. Copy this summary or open your email app and send it when you are ready.</p>
      <textarea aria-label="Freight inquiry summary" readOnly value={summary} rows={14} />
      <div className="mtg-actions"><button className="mtg-button" type="button" onClick={async () => { try { await navigator.clipboard.writeText(summary); setCopied(true); setCopyError(false); } catch { setCopyError(true); } }}>Copy summary</button><a className="mtg-button mtg-button-outline" href={`mailto:mtglobal39@gmail.com?subject=${encodeURIComponent('Freight quote inquiry')}&body=${encodeURIComponent(summary)}`}>Open email app ↗</a></div>
      <p role="status">{copied ? 'Summary copied. Nothing has been sent.' : copyError ? 'Copy is unavailable. Select the summary above and copy it manually.' : 'Your email app controls sending. This website does not send email.'}</p>
    </div>}
  </div>;
}
