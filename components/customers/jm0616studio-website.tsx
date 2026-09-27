import Image from "next/image";
import Link from "next/link";
import type { CustomerPage, CustomerSite } from "@/lib/customers/schema";
import "./jm0616studio.css";

const root = "/jm0616studio";
const navigation = [["Home", ""], ["Services", "/services"], ["About", "/about"], ["Contact", "/contact"]];

function StudioImage({ site, study = false, priority = false }: { site: CustomerSite; study?: boolean; priority?: boolean }) {
  const image = study ? site.images.gallery[0] : site.images.hero;
  return <Image src={image.src} alt={image.alt} fill sizes="(max-width: 760px) 100vw, 65vw" priority={priority} />;
}

function ContactLink({ children = "Start a conversation" }: { children?: React.ReactNode }) {
  return <Link className="jmstudio-button" href={`${root}/contact`}>{children}<span aria-hidden="true">↗</span></Link>;
}

function Home({ site }: { site: CustomerSite }) {
  return <>
    <section className="jmstudio-hero jmstudio-wrap">
      <div className="jmstudio-kicker"><span>Independent visual direction / Website concept</span><span>01 — Introduction</span></div>
      <h1>A different<br/><em>point of view.</em></h1>
      <div className="jmstudio-hero-bottom"><p>{site.pages.home.intro}</p><ContactLink/></div>
      <figure className="jmstudio-hero-image"><StudioImage site={site} priority/><figcaption><span>FORM / LIGHT / PERSPECTIVE</span><span>AI concept study — not client work</span></figcaption></figure>
    </section>
    <section id="visual-studies" className="jmstudio-wrap jmstudio-section jmstudio-studies">
      <div className="jmstudio-study-intro"><p className="jmstudio-label">02 / Visual exploration</p><h2>Less noise.<br/>More <em>feeling.</em></h2><p>A first look at the visual world of this website concept. These original AI-generated studies set the tone; approved studio projects will take their place.</p><Link className="jmstudio-text-link" href={`${root}/about`}>Meet the studio <span aria-hidden="true">↗</span></Link></div>
      <figure><div className="jmstudio-study-image"><StudioImage site={site} study/></div><figcaption><span>Material study / 01</span><span>AI-generated preview artwork</span></figcaption></figure>
    </section>
    <section className="jmstudio-dark"><div className="jmstudio-wrap jmstudio-section jmstudio-split"><div><p className="jmstudio-label">03 / The starting point</p><h2>Bring the idea.<br/>Leave room<br/>for <em>possibility.</em></h2></div><div className="jmstudio-copy"><p>Every project starts somewhere: an image in your head, a story to tell, a different way of seeing.</p><p>Tell JM0616STUDIO what you have in mind. The studio can confirm the right services, scope and next steps directly.</p><Link className="jmstudio-text-link" href={`${root}/services`}>Explore project inquiries ↗</Link></div></div></section>
    <section className="jmstudio-wrap jmstudio-section jmstudio-closing"><p className="jmstudio-label">An idea worth exploring?</p><h2>Let’s start<br/><em>with a conversation.</em></h2><ContactLink/></section>
  </>;
}

function Services({ site }: { site: CustomerSite }) {
  return <div className="jmstudio-wrap"><section className="jmstudio-section jmstudio-page-intro"><p className="jmstudio-label">01 / Project inquiries</p><h1>Begin with<br/><em>the idea.</em></h1><p>{site.pages.services.intro}</p></section>
    <section className="jmstudio-service-layout"><figure className="jmstudio-service-image"><StudioImage site={site} study priority/><figcaption>AI material study · preview only</figcaption></figure><div><p className="jmstudio-label">Creative studio projects</p><h2>Your vision.<br/>An open brief.</h2><p>{site.services[0].description}</p><p className="jmstudio-note">Service details are awaiting owner confirmation. Photography, videography and production packages are not confirmed offerings on this preview.</p><ContactLink>Discuss a project</ContactLink></div></section>
    <section className="jmstudio-section"><p className="jmstudio-label">For a useful first conversation</p><div className="jmstudio-inquiry-list">{[["01", "The idea", "What would you like to make, and who is it for?"], ["02", "The scope", "What outputs or creative support do you have in mind?"], ["03", "The timing", "Share your preferred dates and any important deadlines."]].map(([n,t,d])=><article key={n}><span>{n}</span><div><h3>{t}</h3><p>{d}</p></div></article>)}</div></section></div>;
}

function About({ site }: { site: CustomerSite }) {
  return <><section className="jmstudio-wrap jmstudio-section jmstudio-about"><div><p className="jmstudio-label">The studio / Introduction</p><h1>Room for<br/>a new<br/><em>perspective.</em></h1></div><div className="jmstudio-copy"><p className="jmstudio-large">{site.pages.about.paragraphs[0]}</p><p>{site.pages.about.paragraphs[1]}</p><p className="jmstudio-note">{site.pages.about.paragraphs[2]}</p><ContactLink>Get in touch</ContactLink></div></section><figure className="jmstudio-about-image"><StudioImage site={site} priority/><figcaption>Original AI visual study. Not a photograph of the studio or its work.</figcaption></figure><section className="jmstudio-wrap jmstudio-section jmstudio-split"><p className="jmstudio-label">A considered direction</p><h2>Space to think.<br/>Space to <em>create.</em></h2></section></>;
}

function Contact({ site }: { site: CustomerSite }) {
  return <div className="jmstudio-wrap"><section className="jmstudio-section jmstudio-page-intro"><p className="jmstudio-label">Contact / Start here</p><h1>What are you<br/><em>imagining?</em></h1></section><section className="jmstudio-contact-layout"><aside><p>{site.pages.contact.intro}</p><div className="jmstudio-contact-item"><small>Email</small><a href={`mailto:${site.contact.email.value}`}>{site.contact.email.value}</a></div><div className="jmstudio-contact-item"><small>Phone</small><a href={`tel:${site.contact.phone.value.replace(/[^+\d]/g, "")}`}>{site.contact.phone.value}</a></div><p className="jmstudio-note">Contact details supplied in the customer request; final owner verification pending. No address or business hours have been confirmed.</p></aside><div className="jmstudio-form-panel"><h2>A starting point.</h2><p id="jmstudio-form-status" role="status">Preview only — this inquiry form is disabled. Nothing entered here is sent or saved.</p><form aria-label="Inactive project inquiry form" aria-describedby="jmstudio-form-status"><fieldset disabled><legend>Project inquiry · inactive</legend><div className="jmstudio-form-grid"><label>Name<input name="name" autoComplete="name" placeholder="Your name"/></label><label>Email<input name="email" type="email" autoComplete="email" placeholder="you@example.com"/></label><label>Phone<input name="phone" type="tel" autoComplete="tel" placeholder="Your phone number"/></label><label>Project / requested service<input name="service" placeholder="What do you have in mind?"/></label></div><label>Tell us about the idea<textarea name="message" rows={5} placeholder="Your goals, scope and timing"/></label><label className="jmstudio-consent"><input type="checkbox" name="consent"/>I agree to be contacted about this inquiry, as described in the privacy notice.</label><button type="button">Inquiry form not active</button></fieldset><Link className="jmstudio-text-link" href={`${root}/privacy`}>Read the draft privacy notice ↗</Link></form></div></section></div>;
}

export function Jm0616StudioWebsite({ site, page }: { site: CustomerSite; page: CustomerPage }) {
  return <div className="jmstudio"><a className="jmstudio-skip" href="#studio-main">Skip to content</a><div className="jmstudio-preview">DESIGN PREVIEW · Draft content & AI concept imagery · Not a live customer website</div>
    <header className="jmstudio-header jmstudio-wrap"><Link href={root} aria-label="JM0616STUDIO home"><Image src={site.branding.logoPath} alt="JM0616STUDIO logo concept" width={310} height={64} className="jmstudio-logo"/></Link><nav className="jmstudio-desktop-nav" aria-label="Studio navigation">{navigation.map(([label,path])=><Link key={label} aria-current={page === (path.slice(1) || "home") ? "page" : undefined} href={root+path}>{label}</Link>)}</nav><details className="jmstudio-menu"><summary>Menu +</summary><nav aria-label="Mobile studio navigation">{navigation.map(([label,path])=><Link key={label} href={root+path}>{label}</Link>)}<Link href={`${root}/privacy`}>Privacy</Link></nav></details></header>
    <main id="studio-main">{page === "home" ? <Home site={site}/> : page === "services" ? <Services site={site}/> : page === "about" ? <About site={site}/> : page === "contact" ? <Contact site={site}/> : <section className="jmstudio-wrap jmstudio-section jmstudio-privacy"><p className="jmstudio-label">Information / Draft notice</p><h1>Privacy,<br/><em>plainly.</em></h1>{site.pages.privacy.body.map((text,i)=><article key={text}><span>0{i+1}</span><p>{text}</p></article>)}<Link className="jmstudio-text-link" href={`${root}/contact`}>Contact the studio ↗</Link></section>}</main>
    <div id="myndy-jm0616studio" data-myndy-placeholder="true" data-agent-name={site.myndy.agentName} hidden/>
    <footer className="jmstudio-footer"><div className="jmstudio-wrap"><div className="jmstudio-footer-top"><Link href={root}><Image src="/customers/jm0616studio/logo-light.svg" alt="JM0616STUDIO logo concept" width={310} height={64} className="jmstudio-logo"/></Link><p>Ideas begin here.<br/><Link href={`${root}/contact`}>Let’s talk ↗</Link></p></div><div className="jmstudio-footer-bottom"><p>© 2026 {site.business.name}. Website designed by <a href="https://www.theredspectrum.com/" target="_blank" rel="noopener noreferrer">Red Spectrum</a>.</p><nav aria-label="Studio footer navigation">{navigation.map(([label,path])=><Link key={label} href={root+path}>{label}</Link>)}<Link href={`${root}/privacy`}>Privacy</Link></nav></div></div></footer>
  </div>;
}
