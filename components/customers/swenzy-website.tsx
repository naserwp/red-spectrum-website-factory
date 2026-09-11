import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, MapPin, Phone, Mail, ArrowRight } from "lucide-react";
import type { CustomerPage, CustomerSite } from "@/lib/customers/schema";
import { SwenzyForm, SwenzyMyndy, SwenzyNav } from "./swenzy-interactive";
import "./swenzy.css";
const root = "/swenzy-logistics";
const assets = "/customers/swenzy-logistics";
function Cta({ children = "Discuss your shipment", quiet = false }: { children?: React.ReactNode; quiet?: boolean }) {
  return <Link href={root + "/contact#inquiry"} className={quiet ? "sw-text-link" : "sw-button"}>{children}<ArrowUpRight size={20}/></Link>;
}
function Photo({ src, alt }: { src: string; alt: string }) {
  return <Image src={src} alt={alt} width={1536} height={1024} sizes="(max-width: 760px) 100vw, 55vw" className="sw-photo"/>;
}
function Steps() {
  return <ol className="sw-steps">{[
    ["Share the details", "Tell us the pickup and destination, shipment type and preferred date."],
    ["Talk it through", "Discuss your requirements and questions directly with the business."],
    ["Confirm the next step", "Receive confirmation of any scope, pricing and availability before proceeding."]
  ].map(([title, text], i) => <li key={title}><span className="sw-step-number">0{i+1}</span><div><h3>{title}</h3><p>{text}</p></div><ArrowUpRight aria-hidden="true"/></li>)}</ol>;
}
function Home({ site }: { site: CustomerSite }) {
  return <><section className="sw-hero">
    <Image src={site.images.hero.src} alt={site.images.hero.alt} fill priority sizes="100vw" className="sw-hero-image"/><div className="sw-hero-shade"/>
    <div className="sw-wrap sw-hero-content"><p className="sw-kicker"><span/>Baton Rouge, Louisiana</p><h1>Every move<br/>starts with a<br/><em>conversation.</em></h1><p className="sw-hero-intro">{site.pages.home.intro}</p><Cta/><div className="sw-hero-bottom"><span>Transportation & logistics</span><span>SWENZY / LA <ArrowRight size={16}/></span></div></div>
    </section>
    <div className="sw-location-strip"><div className="sw-wrap"><span><MapPin size={17}/> Baton Rouge, LA</span><span>Logistics Made Easy</span><a href="tel:+12252297347"><Phone size={16}/>(225) 229-7347</a></div></div>
    <section className="sw-wrap sw-section sw-intro"><div><p className="sw-kicker">A clear starting point</p><h2>What needs<br/>to move <span className="sw-serif">next?</span></h2></div><div className="sw-intro-copy"><p className="sw-lead">The route begins with your requirements.</p><p>From the first question to the details of your shipment, start a conversation with Swenzy Logistics about your transportation needs.</p><Cta quiet>Explore the inquiry process</Cta></div></section>
    <section className="sw-wrap sw-editorial"><div className="sw-editorial-image"><Photo {...site.images.gallery[0]}/><span className="sw-image-label">THE DETAILS MAKE THE DIFFERENCE</span></div><div className="sw-editorial-copy"><p className="sw-kicker">Tell us about your shipment</p><h2>A little detail.<br/>A better conversation.</h2><p>Where is it going? What are you moving? When do you need it? Give the business the information it needs to review your request.</p><ul className="sw-simple-list"><li>Pickup & destination</li><li>Shipment type, size & weight</li><li>Requested date & contact preference</li></ul><Link href={root + "/services"} className="sw-text-link">How to get started <ArrowUpRight size={20}/></Link></div></section>
    <section className="sw-wrap sw-section sw-process"><div><p className="sw-kicker">From inquiry to next steps</p><h2>Keep the<br/>conversation<br/><span className="sw-serif">moving.</span></h2><p>No assumptions. Discuss the details, then confirm what comes next.</p></div><Steps/></section>
    <section className="sw-road"><Photo {...site.images.gallery[1]}/><div className="sw-road-caption"><span className="sw-kicker">Swenzy Logistics</span><h2>Let’s talk<br/>transportation.</h2><Cta/></div></section></>;
}
function Services({ site }: { site: CustomerSite }) {
  return <><section className="sw-wrap sw-section sw-services-head"><div><p className="sw-kicker">Transportation & logistics</p><h1>Your shipment.<br/>The right <span className="sw-serif">questions.</span></h1></div><p className="sw-lead">{site.pages.services.intro}</p></section>
    <section className="sw-wrap sw-service-feature"><Photo {...site.images.gallery[1]}/><div><p className="sw-kicker">Start the discussion</p><h2>Transportation<br/>& logistics.</h2><p>{site.services[0].description}</p><Cta/></div></section>
    <section className="sw-wrap sw-section"><div className="sw-section-title"><p className="sw-kicker">Prepare your inquiry</p><h2>Bring the details.<br/>We’ll start there.</h2></div><Steps/></section>
    <section className="sw-wrap sw-faq sw-section"><div><p className="sw-kicker">Good questions</p><h2>Before you<br/><span className="sw-serif">reach out.</span></h2></div><div>{[
      ["Can I request a quote?", "Yes. Call or email with your shipment details to request a discussion. Pricing, availability and service suitability must be confirmed by the business."],
      ["Which routes and shipment types are available?", "Please ask Swenzy about your specific pickup, destination and shipment requirements. This preview does not list confirmed routes or equipment capabilities."],
      ["Is an inquiry a confirmed booking?", "No. Sending an inquiry or speaking with the AI assistant does not reserve transportation or confirm pricing."],
      ["What should I include?", "Your contact details, pickup and destination, shipment type, approximate size or weight, requested date and preferred callback method."]
    ].map(([q,a])=><details key={q}><summary>{q}<span aria-hidden="true">+</span></summary><p>{a}</p></details>)}</div></section></>;
}
function About({ site }: { site: CustomerSite }) {
  return <><section className="sw-about-hero"><div className="sw-wrap"><p className="sw-kicker">About Swenzy</p><h1>From Baton Rouge.<br/><span className="sw-serif">Looking ahead.</span></h1><p>Transportation & logistics.<br/>A conversation about what comes next.</p></div><span className="sw-watermark" aria-hidden="true">SW</span></section>
    <section className="sw-wrap sw-section sw-about-story"><Photo {...site.images.gallery[0]}/><div><p className="sw-kicker">Logistics Made Easy</p><h2>A straightforward<br/>place to start.</h2>{site.pages.about.paragraphs.map(p=><p key={p}>{p}</p>)}<Link href={root + "/contact"} className="sw-text-link">Connect with Swenzy <ArrowUpRight size={20}/></Link></div></section>
    <section className="sw-wrap sw-about-note"><MapPin size={34}/><div><p className="sw-kicker">Our public location</p><h2>Baton Rouge, Louisiana.</h2><p>For transportation availability and specific routes, please contact the business.</p></div><Cta quiet>Get in touch</Cta></section></>;
}
function Contact({ site }: { site: CustomerSite }) {
  return <section className="sw-wrap sw-section sw-contact" id="inquiry"><aside><p className="sw-kicker">Start a conversation</p><h1>Let’s talk about<br/>your <span className="sw-serif">next move.</span></h1><p>{site.pages.contact.intro}</p><div className="sw-contact-details"><a href="tel:+12252297347"><Phone/><span><small>Call Swenzy</small>{site.contact.phone.value}</span></a><a href={"mailto:"+site.contact.email.value}><Mail/><span><small>Email your inquiry</small>{site.contact.email.value}</span></a><div><MapPin/><span><small>Location</small>Baton Rouge, LA</span></div></div><Photo {...site.images.gallery[0]}/><p className="sw-small">An inquiry is a starting point, not a confirmed booking.</p></aside><SwenzyForm mode={site.form.mode}/></section>;
}
function Privacy({ site }: { site: CustomerSite }) {
  const titles = ["About this policy","Contacting Swenzy","Website inquiry form","Myndy AI assistant","Technical information","Questions & requests"];
  return <section className="sw-wrap sw-section sw-privacy"><aside><p className="sw-kicker">Your information</p><h1>Privacy<br/><span className="sw-serif">Policy.</span></h1><p>Preview policy · September 2026<br/>Pending business review.</p></aside><div>{site.pages.privacy.body.map((p,i)=><section key={p}><span className="sw-kicker">0{i+1}</span><h2>{titles[i]}</h2><p>{p}</p></section>)}<Link href={root+"/contact"} className="sw-text-link">Contact the business <ArrowUpRight size={20}/></Link></div></section>;
}
export function SwenzyWebsite({ site, page }: { site: CustomerSite; page: CustomerPage }) {
  return <div className="sw-site"><a href="#sw-main" className="sw-skip">Skip to content</a><div className="sw-preview">Customer review preview · Branding & content pending approval</div>
    <header className="sw-header"><div className="sw-wrap"><Link href={root} aria-label="Swenzy Logistics home"><Image src={site.branding.logoPath} alt="Swenzy Logistics" width={244} height={62} priority className="sw-logo"/></Link><SwenzyNav key={page} page={page}/></div></header>
    <main id="sw-main">{page === "home" ? <Home site={site}/> : page === "services" ? <Services site={site}/> : page === "about" ? <About site={site}/> : page === "contact" ? <Contact site={site}/> : <Privacy site={site}/>}</main>
    <section className="sw-assistant sw-wrap" aria-labelledby="sw-miles-heading"><Image src={assets+"/images/miles-avatar.webp"} width={140} height={140} alt="Miles, a fictional AI assistant avatar concept"/><div><p className="sw-kicker">A digital first point of contact</p><h2 id="sw-miles-heading">Meet Miles. Your AI starting point.</h2><p>Ask about a transportation inquiry using the assistant. Confirm all pricing, availability and bookings directly with Swenzy.</p><p className="sw-small">Miles identity and knowledge are prepared for manual Myndy setup. The embedded agent may still show its existing configuration.</p></div></section>
    <footer className="sw-footer"><div className="sw-wrap"><div className="sw-footer-top"><Link href={root} aria-label="Swenzy Logistics home"><Image src={site.branding.logoPath} alt="Swenzy Logistics" width={244} height={62}/></Link><p>Logistics Made Easy.<br/><span>Baton Rouge, Louisiana.</span></p><nav aria-label="Footer navigation">{["Home","Services","About","Contact","Privacy"].map(p=><Link key={p} href={root+(p==="Home"?"":"/"+p.toLowerCase())}>{p}</Link>)}</nav></div><p className="sw-image-disclosure">Original illustrative imagery. Trucks, people and locations shown do not represent Swenzy’s fleet, employees or premises.</p><div className="sw-footer-bottom"><p>© {new Date().getFullYear()} Swenzy Logistics LLC. Website designed by <a href="https://www.theredspectrum.com/" target="_blank" rel="noreferrer">Red Spectrum</a>.</p><Link href="/">RS Website Factory <ArrowUpRight size={14}/></Link></div></div></footer>
    {site.myndy.embed.enabled && <SwenzyMyndy agentId={site.myndy.embed.agentId} scriptUrl={site.myndy.embed.scriptUrl}/>}
  </div>;
}
