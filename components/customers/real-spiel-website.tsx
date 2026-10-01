import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Menu, Sparkles } from "lucide-react";
import { CustomerContactForm } from "@/components/customer-contact-form";
import type { CustomerPage, CustomerSite } from "@/lib/customers/schema";
import "./real-spiel.css";

const steps = [
  { number: "01", title: "Tell us about the space", body: "Share the type of space, the areas that matter, and any timing or access details." },
  { number: "02", title: "Clarify the scope", body: "Confirm the requested service, products, schedule, and availability directly with the business." },
  { number: "03", title: "Agree on the next step", body: "Move forward only after the details and expectations have been reviewed together." },
];

function DraftTag() {
  return <span className="rs-draft-tag">Preview concept · customer review required</span>;
}

function Header({ site }: { site: CustomerSite }) {
  const root = `/${site.slug}`;
  const links = [["Home", root], ["Services", `${root}/services`], ["About", `${root}/about`], ["Contact", `${root}/contact`]];
  return <header className="rs-header"><div className="rs-container rs-header-inner">
    <Link href={root} className="rs-brand" aria-label="REAL SPIEL home"><Image src={site.branding.logoPath} alt="REAL SPIEL CLEANING COMPANY preview logo" width={390} height={82} priority /></Link>
    <nav className="rs-desktop-nav" aria-label="Primary navigation">{links.map(([name, href]) => <Link key={name} href={href}>{name}</Link>)}</nav>
    <Link className="rs-header-cta" href={`${root}/contact`}>Get in touch <ArrowRight size={16} aria-hidden="true" /></Link>
    <details className="rs-mobile-menu"><summary aria-label="Open navigation"><Menu size={23} aria-hidden="true" /></summary><nav aria-label="Mobile navigation">{links.map(([name, href]) => <Link key={name} href={href}>{name}</Link>)}<Link href={`${root}/privacy`}>Privacy</Link></nav></details>
  </div></header>;
}

function Footer({ site }: { site: CustomerSite }) {
  const root = `/${site.slug}`;
  return <footer className="rs-footer"><div className="rs-container rs-footer-grid"><div><Image src={site.branding.logoPath} alt="REAL SPIEL CLEANING COMPANY preview logo" width={260} height={55} /><p>A considered concept for a clearer cleaning conversation.</p><DraftTag /></div><nav aria-label="Footer navigation"><Link href={root}>Home</Link><Link href={`${root}/services`}>Services</Link><Link href={`${root}/about`}>About</Link><Link href={`${root}/contact`}>Contact</Link><Link href={`${root}/privacy`}>Privacy</Link></nav><div><p>Website designed by <a href="https://www.theredspectrum.com/" target="_blank" rel="noopener noreferrer">Red Spectrum</a>.</p><p>© {new Date().getFullYear()} REAL SPIEL CLEANING COMPANY</p></div></div></footer>;
}

function ServiceCards({ site }: { site: CustomerSite }) {
  return <div className="rs-service-grid">{site.services.map((service, index) => <article className="rs-service-card" key={service.name}><span className="rs-card-number">0{index + 1}</span><Sparkles size={23} aria-hidden="true" /><h3>{service.name}</h3><p>{service.description}</p><small>Service direction · confirm before publication</small></article>)}</div>;
}

function Home({ site }: { site: CustomerSite }) {
  const root = `/${site.slug}`;
  return <main>
    <section className="rs-hero"><Image src={site.images.hero.src} alt={site.images.hero.alt} fill sizes="100vw" priority className="rs-hero-image" /><div className="rs-hero-shade" /><div className="rs-container rs-hero-content"><DraftTag /><p className="rs-eyebrow">A fresh perspective on clean</p><h1>Make room for a <em>fresher start.</em></h1><p className="rs-hero-intro">{site.pages.home.intro}</p><div className="rs-actions"><Link className="rs-button rs-button-gold" href={`${root}/services`}>Explore services <ArrowRight size={18} aria-hidden="true" /></Link><Link className="rs-text-link rs-light" href={`${root}/contact`}>Plan your inquiry <ArrowRight size={17} aria-hidden="true" /></Link></div></div></section>
    <section className="rs-intro rs-container"><div><p className="rs-eyebrow">A clear place to begin</p><h2>Thoughtful cleaning starts with <em>understanding the space.</em></h2></div><div><p>The request describes cleaning, deep cleaning, and sanitation. This site offers an initial way to explore those needs, with exact services and availability still to be confirmed by the business.</p><Link className="rs-text-link" href={`${root}/about`}>About this preview <ArrowRight size={17} aria-hidden="true" /></Link></div></section>
    <section className="rs-section rs-pale"><div className="rs-container"><div className="rs-section-head"><div><p className="rs-eyebrow">Service directions</p><h2>Care for the spaces <em>you live and work in.</em></h2></div><p>These are draft content directions based on the request, not a confirmed service menu.</p></div><ServiceCards site={site}/><Link className="rs-text-link" href={`${root}/services`}>View service details <ArrowRight size={17} aria-hidden="true" /></Link></div></section>
    <section className="rs-feature rs-container"><div className="rs-feature-image"><Image src={site.images.gallery[0].src} alt={site.images.gallery[0].alt} fill sizes="(min-width: 768px) 50vw, 100vw" /></div><div className="rs-feature-copy"><p className="rs-eyebrow">How a good request begins</p><h2>A simple process. <em>Clear expectations.</em></h2><div className="rs-steps">{steps.map(step => <article key={step.number}><span>{step.number}</span><div><h3>{step.title}</h3><p>{step.body}</p></div></article>)}</div><Link className="rs-button rs-button-dark" href={`${root}/contact`}>Discuss your space <ArrowRight size={18} aria-hidden="true" /></Link></div></section>
    <section className="rs-bottom-cta"><div className="rs-container"><p className="rs-eyebrow">Your next step</p><h2>Start with the details.<br/><em>We’ll make them count.</em></h2><p>Inquiry delivery is paused in this staging preview while the business confirms a contact recipient.</p><Link className="rs-button rs-button-gold" href={`${root}/contact`}>Contact information <ArrowRight size={18} aria-hidden="true" /></Link></div></section>
  </main>;
}

function PageHero({ label, title, intro }: { label: string; title: string; intro: string }) {
  return <section className="rs-page-hero"><div className="rs-container"><DraftTag /><p className="rs-eyebrow">{label}</p><h1>{title}</h1><p>{intro}</p></div></section>;
}

function Interior({ site, page }: { site: CustomerSite; page: Exclude<CustomerPage, "home"> }) {
  const root = `/${site.slug}`;
  if (page === "services") return <main><PageHero label="Service directions" title={site.pages.services.headline} intro={site.pages.services.intro}/><section className="rs-section rs-container"><ServiceCards site={site}/><p className="rs-disclosure">The business must confirm the scope, methods, equipment, and availability of each service before this draft is published.</p></section><section className="rs-section rs-pale"><div className="rs-container"><p className="rs-eyebrow">From question to clarity</p><h2>How the conversation <em>can work.</em></h2><div className="rs-steps rs-steps-grid">{steps.map(step => <article key={step.number}><span>{step.number}</span><div><h3>{step.title}</h3><p>{step.body}</p></div></article>)}</div><Link className="rs-button rs-button-dark" href={`${root}/contact`}>Plan your inquiry <ArrowRight size={18} /></Link></div></section></main>;
  if (page === "about") return <main><PageHero label="About the concept" title={site.pages.about.headline} intro="A clear, calm visual direction for a business ready to explain what it offers."/><section className="rs-feature rs-container"><div className="rs-feature-image"><Image src={site.images.gallery[0].src} alt={site.images.gallery[0].alt} fill sizes="(min-width: 768px) 50vw, 100vw" /></div><div className="rs-feature-copy"><p className="rs-eyebrow">The business story</p><h2>A useful introduction, <em>ready for the real story.</em></h2>{site.pages.about.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}<div className="rs-about-list"><p><Check size={18}/> Customer-submitted business name and cleaning focus</p><p><Check size={18}/> Distinctive preview identity and locally stored imagery</p><p><Check size={18}/> Final facts and claims require customer approval</p></div><Link className="rs-text-link" href={`${root}/services`}>Explore service directions <ArrowRight size={17} /></Link></div></section></main>;
  if (page === "contact") return <main><PageHero label="Contact" title={site.pages.contact.headline} intro={site.pages.contact.intro}/><section className="rs-section rs-container rs-contact-grid"><div><p className="rs-eyebrow">Before reaching out</p><h2>Good details make <em>a better start.</em></h2><p>Consider the type and size of the space, the cleaning priorities, preferred timing, and any access or material considerations.</p><p className="rs-disclosure">Public phone, email, service area, and lead recipient have not been confirmed. Please do not send personal information through this preview.</p></div><div className="rs-contact-card"><h3>Inquiry form</h3>{site.form.mode === "disabled" ? <><p>Inquiries are temporarily unavailable while the contact recipient and delivery test are reviewed.</p><p className="rs-form-status" role="status">Form disabled · no information is collected or emailed.</p></> : <CustomerContactForm customerSlug={site.slug} accent={site.branding.primary}/>}</div></section></main>;
  return <main><PageHero label="Privacy" title={site.pages.privacy.headline} intro="A draft notice for business and legal review."/><section className="rs-section rs-container rs-privacy">{site.pages.privacy.body.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</section></main>;
}

export function RealSpielWebsite({ site, page }: { site: CustomerSite; page: CustomerPage }) {
  return <div className="rs-site"><div className="rs-preview-bar">Draft customer preview · not approved for publication</div><Header site={site}/>{page === "home" ? <Home site={site}/> : <Interior site={site} page={page}/>}<Footer site={site}/></div>;
}
