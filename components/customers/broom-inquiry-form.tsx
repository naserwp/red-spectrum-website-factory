import { broomServices } from '@/lib/customers/broom-content';

export function BroomInquiryForm({ root, enabled }: { root: string; enabled: boolean }) {
  return <div className="bh-form-panel">
    <p className="bh-kicker">Start a conversation</p>
    <h2>Your plans.<br /><em>Our starting point.</em></h2>
    <p>Tell us a little about your next move. The team will use these details to respond to your inquiry.</p>
    <p id="bh-form-status" className="bh-form-status" role="status" aria-live="polite" tabIndex={-1}>{enabled ? 'Fields marked * are required.' : 'Online inquiries are currently unavailable. Please call or email the team.'}</p>
    <form data-broom-contact action="/api/leads/broom-home-enterprises-llc" method="post" aria-label="Contact Broom Home" aria-describedby="bh-form-status">
      <fieldset disabled={!enabled}>
        <legend className="bh-sr-only">Your inquiry</legend>
        <div className="bh-form-row">
          <label htmlFor="bh-name">Your name *<input id="bh-name" name="name" autoComplete="name" required minLength={2} maxLength={100} /></label>
          <label htmlFor="bh-email">Email address *<input id="bh-email" name="email" type="email" autoComplete="email" required maxLength={200} /></label>
        </div>
        <div className="bh-form-row">
          <label htmlFor="bh-phone">Phone (optional)<input id="bh-phone" name="phone" type="tel" autoComplete="tel" maxLength={40} /></label>
          <label htmlFor="bh-service">I’m interested in *<select id="bh-service" name="service" required defaultValue=""><option value="">Choose a service</option>{broomServices.map(s => <option key={s.slug}>{s.name}</option>)}</select></label>
        </div>
        <label htmlFor="bh-message">Your plans *<textarea id="bh-message" name="message" rows={5} required minLength={5} maxLength={3000} placeholder="What would you like help with?" /></label>
        <div className="bh-honeypot" aria-hidden="true"><label>Leave this empty<input name="botcheck" tabIndex={-1} autoComplete="off" /></label></div>
        <label className="bh-consent"><input name="consent" type="checkbox" required /><span>I agree that Broom Home may contact me about this inquiry. I have read the <a href={`${root}/privacy`}>privacy notice</a>.</span></label>
        <button className="bh-button" type="submit" disabled={!enabled}>Send inquiry <span aria-hidden="true">↗</span></button>
      </fieldset>
    </form>
    <p className="bh-small">Please don’t include account numbers, identification documents or sensitive financial information. An inquiry is not a booking or service agreement.</p>
  </div>;
}
