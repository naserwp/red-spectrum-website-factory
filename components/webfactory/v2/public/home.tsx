import Link from "next/link";
import { getCustomerSites } from "@/lib/customers/registry";
import { DesignGrid } from "./design-grid";
import { V2Shell } from "../shell";

const workbench = [
  ["Customer request", "Capture the business, audience, goals, and creative direction."],
  ["Brief ready", "Turn the reviewed request into a focused website blueprint."],
  ["Website build", "Bring the agreed brief and customer branding together."],
  ["Preview ready", "Open the customer's existing preview for review."],
  ["Approval", "Confirm the details and approve the next step explicitly."],
] as const;

const pipeline = [
  ["Request", "Share your business and what the website needs to achieve."],
  ["Review", "Check the requirements, content, and intended audience."],
  ["Brief", "Agree on the pages, design direction, and scope."],
  ["Build", "Create the website around the customer's identity."],
  ["Preview", "Review the website through its dedicated customer URL."],
  ["Approval", "Request refinements and approve the final direction."],
] as const;

export function V2Home() {
  const customers = getCustomerSites();

  return (
    <V2Shell>
      <div className="v2-container">
        <section className="v2-hero">
          <span className="v2-badge">● AI-POWERED WEBSITE STUDIO FOR RED SPECTRUM CLIENTS</span>
          <h1>Launch customer websites faster with <em>RS WebFactory.</em></h1>
          <p>An AI-assisted studio with a thoughtful workflow for collecting requests, shaping website briefs, reviewing customer previews, and preparing an approved handoff.</p>
          <div className="v2-actions">
            <Link className="v2-button v2-red" href="/request">Start a website request ↗</Link>
            <Link className="v2-button v2-quiet" href="/designs#customer-previews">Explore customer previews</Link>
          </div>
          <div className="v2-trust"><span>Manual admin approval</span><span>Customer privacy first</span><span>A clear path to launch</span></div>
          <section className="v2-workbench" aria-labelledby="studio-workbench-title">
            <header><h2 id="studio-workbench-title">RS Studio Workbench</h2><span>From customer request to approval</span></header>
            <ol className="v2-workbench-grid v2-studio-workbench">
              {workbench.map(([title, description], index) => (
                <li key={title}><span className="v2-badge">Stage {index + 1}</span><h3>{title}</h3><p>{description}</p></li>
              ))}
            </ol>
          </section>
        </section>
      </div>
      <div className="v2-tint">
        <section id="how-it-works" className="v2-container v2-section" aria-labelledby="studio-pipeline-title">
          <div className="v2-section-head"><div><span className="v2-eyebrow">Predictable production</span><h2 id="studio-pipeline-title">One customer pipeline. A clear next step.</h2></div><p className="v2-muted">From first request to final approval.</p></div>
          <ol className="v2-studio-pipeline">
            {pipeline.map(([title, description], index) => (
              <li key={title}><b>{String(index + 1).padStart(2, "0")}</b><h3>{title}</h3><p>{description}</p></li>
            ))}
          </ol>
        </section>
      </div>
      <section className="v2-container v2-section" aria-labelledby="studio-customers-title">
        <div className="v2-section-head"><div><span className="v2-eyebrow">Customer websites</span><h2 id="studio-customers-title">Existing customers. Their own preview.</h2></div><Link href="/designs#customer-previews">Open customer preview catalog ↗</Link></div>
        <p className="v2-muted">Registered customer websites keep their own branding and preview URLs. Preview availability follows each customer&apos;s existing build and review process.</p>
        <ul className="v2-studio-customers">
          {customers.map((customer) => (
            <li key={customer.slug}><strong>{customer.business.name}</strong><span>Registered customer website</span></li>
          ))}
        </ul>
      </section>
      <section className="v2-container v2-section">
        <div className="v2-section-head"><div><span className="v2-eyebrow">A little inspiration</span><h2>Find your next online identity.</h2></div><Link href="/designs">Explore all designs ↗</Link></div>
        <DesignGrid />
      </section>
      <section className="v2-privacy-band">
        <h2>Private customer data stays private.</h2>
        <p>Public previews show the creative work. Internal request details, notes, and review logs stay out of the public gallery.</p>
        <div className="v2-trust"><span>Manual review checkpoints</span><span>Separate admin access</span><span>Customer websites keep their identity</span></div>
      </section>
      <section className="v2-container v2-section v2-section-head">
        <div><span className="v2-eyebrow">Let’s build what’s next</span><h2>Your business deserves a better first impression.</h2><p className="v2-muted">Tell us what you have in mind. We’ll help shape the direction.</p></div>
        <Link href="/request" className="v2-button v2-red">Start your request ↗</Link>
      </section>
    </V2Shell>
  );
}
