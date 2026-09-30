import Image from 'next/image';
import { Cormorant_Garamond, DM_Sans } from 'next/font/google';
import type { CustomerPage, CustomerSite } from '@/lib/customers/schema';
import { headers } from 'next/headers';
import { customerDomainForHost } from '@/lib/customers/domains';
import { UniqueHomeInquiryForm } from '@/components/unique-home-inquiry-form';
import { UniqueHomeMyndy } from '@/components/unique-home-myndy';
import './unique-home-b2b.css';

const display = Cormorant_Garamond({ subsets: ['latin'], weight: ['400', '500', '600'], display: 'swap', variable: '--uh-display' });
const body = DM_Sans({ subsets: ['latin'], display: 'swap', variable: '--uh-body' });
const pages: { key: CustomerPage; label: string }[] = [
  { key: 'home', label: 'Home' }, { key: 'services', label: 'What We Do' },
  { key: 'about', label: 'About' }, { key: 'contact', label: 'Contact' },
];
const capabilities = [
  { number: '01', title: 'Marketing', image: 1, copy: 'A clearer way to present an objective, shape a message and support business visibility. The right scope begins with a direct conversation.' },
  { number: '02', title: 'Consulting', image: 2, copy: 'Business-oriented discussion that brings priorities, context and possible next steps into focus. Scope is confirmed for each engagement.' },
  { number: '03', title: 'Advertising', image: 3, copy: 'Advertising-oriented support for businesses considering how to communicate an opportunity. Channels and deliverables are discussed directly.' },
  { number: '04', title: 'Real estate context', image: 4, copy: 'Real-estate-oriented business opportunities and objectives can be discussed directly to determine fit and scope.' },
] as const;

type UniqueHomePage = CustomerPage | "thank-you";

export async function UniqueHomeB2B({ site, page }: { site: CustomerSite; page: UniqueHomePage }) {
  const requestHeaders = await headers();
  const domain = customerDomainForHost(requestHeaders.get('x-forwarded-host') ?? '') ?? customerDomainForHost(requestHeaders.get('host') ?? '');
  const base = domain?.slug === site.slug ? '' : `/${site.slug}`;
  const photos = [site.images.hero, ...site.images.gallery];
  const route = (key: CustomerPage) => key === 'home' ? (base || '/') : base + `/${key}`;
  const image = (index: number, className = '', priority = false, sizes = '(max-width: 767px) 100vw, 50vw') => {
    const item = photos[index];
    return <figure className={`ub-photo ${className}`}><Image src={item.src} alt={item.alt} width={item.width} height={item.height} sizes={sizes} priority={priority} /></figure>;
  };
  const button = (label: string, href: string, dark = false) => <a className={`ub-button ${dark ? 'ub-button-dark' : ''}`} href={href}>{label}<span aria-hidden="true">↗</span></a>;
  const nav = (label: string) => <nav aria-label={label}>{pages.map(item => <a key={item.key} href={route(item.key)} aria-current={page === item.key ? 'page' : undefined}>{item.label}</a>)}</nav>;
  const phone = <a href={`tel:${site.contact.phone.value.replace(/[^\d+]/g, '')}`}>{site.contact.phone.value}</a>;
  const email = <a href={`mailto:${site.contact.email.value}`}>{site.contact.email.value}</a>;
  const myndyActive = site.slug === "unique-home-enterprise" && site.myndy.embed.enabled && site.myndy.embed.agentId === "agent_1790790948_rwhM6iVfBBVQx2lJTGf0Fw" && site.myndy.embed.scriptUrl === "https://widget.myndy.ai/myndy-convai-widget.es.js" && domain?.slug === site.slug;
  return <div className={`unique-home-v3 unique-home-b2b ${display.variable} ${body.variable}${myndyActive ? " has-myndy" : ""}`}>
    <a className="ub-skip" href="#main">Skip to content</a>
    <header className="ub-header"><a className="ub-brand" href={route('home')} aria-label={`${site.business.name} home`}><Image src={site.branding.logoPath} alt={site.business.name} width={286} height={68} priority /></a>{nav('Main navigation')}<div className="ub-header-end">{button('Start a conversation', route('contact'), true)}<details className="ub-menu"><summary>Menu <span aria-hidden="true">☰</span></summary>{nav('Mobile navigation')}</details></div></header>
    <main id="main">
      {page === 'home' && <>
        <section className="ub-hero">{image(0, 'ub-hero-image', true, '100vw')}<div className="ub-hero-overlay" /><div className="ub-hero-copy"><p className="ub-eyebrow">UNIQUE HOME ENTERPRISE LLC <span> / Business in perspective</span></p><h1>Strategy.<br />Visibility.<br /><em>Opportunity.</em></h1><p>Marketing, consulting and advertising for business objectives—with a real-estate-oriented perspective.</p><div className="ub-actions">{button('Discuss your goals', route('contact'))}<a className="ub-text-link" href={route('services')}>Explore what we do <span aria-hidden="true">↗</span></a></div></div><div className="ub-hero-foot"><span>Business first. Conversation led.</span><span>01 / 04</span></div></section>
        <section className="ub-intro ub-shell"><p className="ub-eyebrow">A considered approach</p><div><h2>Good business moves begin with <em>clarity.</em></h2><p>UNIQUE HOME ENTERPRISE LLC is a B2B company working across marketing, consulting and advertising in a real-estate-oriented business context. The first conversation is an opportunity to understand the objective and define a useful direction.</p></div></section>
        <section className="ub-feature ub-shell">{image(8, 'ub-feature-photo')}<div className="ub-feature-copy"><p className="ub-eyebrow">A wider perspective</p><h2>Where ideas meet <em>intent.</em></h2><p>Every business initiative has its own context. We begin with the questions that matter: what you want to communicate, whom you need to reach and what needs to happen next.</p>{button('Our perspective', route('about'), true)}</div></section>
        <section className="ub-capabilities"><div className="ub-shell"><div className="ub-section-heading"><p className="ub-eyebrow">What we do</p><h2>Three disciplines.<br /><em>One conversation.</em></h2><p>Explore the broad areas that guide a first discussion. Scope and arrangements are confirmed directly for each business need.</p></div><div className="ub-cap-grid">{capabilities.slice(0, 3).map(item => <a href={route('services')} className="ub-cap" key={item.title}>{image(item.image)}<div><span>{item.number} / {item.title}</span><strong>{item.title}</strong><span aria-hidden="true">↗</span></div></a>)}</div></div></section>
        <section className="ub-wide-image">{image(5, '', false, '100vw')}<div><p className="ub-eyebrow">Commercial perspective</p><h2>The setting changes.<br /><em>The objective matters.</em></h2></div></section>
        <section className="ub-context ub-shell"><div><p className="ub-eyebrow">Real-estate-oriented context</p><h2>Business and place can shape <em>possibility.</em></h2></div><div>{image(4)}<p>Real-estate-oriented business opportunities and objectives can be discussed directly to determine fit and scope. This website does not present property listings, brokerage representation or investment advice.</p>{button('Start a discussion', route('contact'), true)}</div></section>
        <section className="ub-process ub-shell"><div><p className="ub-eyebrow">How we work</p><h2>A clear way <em>forward.</em></h2></div><ol><li><span>01</span><div><strong>Start the conversation</strong><p>Share the business context and the goal you have in mind.</p></div></li><li><span>02</span><div><strong>Define the objective</strong><p>Discuss priorities, questions and potential areas of fit.</p></div></li><li><span>03</span><div><strong>Confirm scope and next steps</strong><p>Agree on what, if anything, should follow the initial discussion.</p></div></li></ol></section>
        <section className="ub-cta"><div className="ub-shell"><p className="ub-eyebrow">The conversation starts here</p><h2>Let’s talk about <em>what’s next.</em></h2>{button('Discuss your goals', route('contact'))}</div></section>
      </>}
      {page === 'services' && <>
        <section className="ub-page-hero ub-services-hero ub-shell"><p className="ub-eyebrow">01 / What We Do</p><h1>Built around the <em>objective.</em></h1><p>Marketing, consulting and advertising are the starting points. The specific scope of work is confirmed directly in the context of your business.</p></section>
        <section className="ub-service-list ub-shell">{capabilities.map((item, index) => <article className="ub-service" key={item.title}><div className="ub-service-label"><span>{item.number} / Capability</span><h2>{item.title}</h2></div>{image(item.image, '', index === 0)}<div className="ub-service-copy"><p>{item.copy}</p><p className="ub-small">Discussion topics: business objectives, context and potential scope.</p>{button('Discuss this area', route('contact'), true)}</div></article>)}</section>
        <section className="ub-mini-story ub-shell">{image(6)}<div><p className="ub-eyebrow">A tailored discussion</p><h2>No two objectives have the same <em>shape.</em></h2><p>Tell us what you are working toward. We can discuss whether the need aligns with current capabilities before confirming any engagement.</p></div></section>
      </>}
      {page === 'about' && <>
        <section className="ub-about-hero">{image(7, '', true, '100vw')}<div className="ub-shell"><p className="ub-eyebrow">02 / About</p><h1>Perspective for the <em>work ahead.</em></h1></div></section>
        <section className="ub-about-intro ub-shell"><p className="ub-eyebrow">UNIQUE HOME ENTERPRISE LLC</p><div><h2>Clarity is a strong place to <em>begin.</em></h2><p>UNIQUE HOME ENTERPRISE LLC brings a B2B perspective to marketing, consulting and advertising, with real-estate-oriented business objectives among the contexts it considers. The company begins with direct discussion of the need at hand.</p></div></section>
        <section className="ub-about-grid ub-shell"><div>{image(9)}<p className="ub-image-note">Illustrative brand imagery, not a company project or office.</p></div><div><p className="ub-eyebrow">Our approach</p><h2>Listen closely. Define the question. <em>Move deliberately.</em></h2><p>Understanding the objective comes before defining the scope. We favor a direct exchange about priorities, fit and next steps over assumptions about what a business needs.</p>{image(10)}</div></section>
        <section className="ub-about-values ub-shell"><p className="ub-eyebrow">Three points of view</p><div><article><span>01</span><h3>Business context</h3><p>Start with the circumstances behind the request.</p></article><article><span>02</span><h3>Clear communication</h3><p>Discuss the message and the audience before deciding on a direction.</p></article><article><span>03</span><h3>Defined next steps</h3><p>Confirm the scope directly, with room for the details that make each need distinct.</p></article></div></section>
      </>}
      {page === 'contact' && <>
        <section className="ub-contact-hero ub-shell"><div><p className="ub-eyebrow">03 / Contact</p><h1>Let’s discuss the <em>objective.</em></h1><p>For marketing, consulting, advertising or a real-estate-related business inquiry, reach UNIQUE HOME ENTERPRISE LLC directly.</p><div className="ub-direct">{phone}{email}</div></div>{image(11, '', true)}</section>
        <section className="ub-contact-body ub-shell"><div><p className="ub-eyebrow">Direct contact</p><h2>Begin the <em>conversation.</em></h2><p>{site.business.name}</p><p className="ub-small">Please confirm any in-person visit, business hours and service territory directly before making arrangements.</p></div><div className="ub-inquiry"><p className="ub-eyebrow">Online inquiry</p><h3>Prefer to write it down?</h3><UniqueHomeInquiryForm active={domain?.slug === site.slug && site.form.mode !== 'disabled'} /><a href={route('privacy')}>Read the privacy notice ↗</a></div></section>
      </>}
       {page === 'privacy' && <section className="ub-privacy ub-shell"><div><p className="ub-eyebrow">04 / Privacy</p><h1>Privacy, in clear <em>terms.</em></h1><p>How this website’s contact options work.</p></div><article>{site.pages.privacy.body.map((text, index) => <div key={text}><span>0{index + 1}</span><p>{text}</p></div>)}</article></section>}
       {page === 'thank-you' && <section className="ub-privacy ub-shell"><div><p className="ub-eyebrow">Inquiry received</p><h1>Thank you. Your inquiry has been <em>received.</em></h1><p>We&apos;ve received your message and the team can review your inquiry.</p><div className="ub-actions"><a className="ub-button ub-button-dark" href={route('home')}>Back to Home</a><a className="ub-text-link" href={route('contact')}>Contact</a></div></div></section>}
    </main>
    <section className="ub-footer-cta" aria-labelledby="ub-footer-cta-title"><div className="ub-shell"><div><p className="ub-eyebrow">A direct conversation</p><h2 id="ub-footer-cta-title">What’s your next <em>move?</em></h2></div>{button('Get in touch', route('contact'), true)}</div></section>
    <footer className="ub-footer"><div className="ub-footer-main ub-shell"><div><Image src={`/customers/${site.slug}/logo-dark.svg`} alt={site.business.name} width={286} height={68} /><p>Marketing · Consulting · Advertising</p></div><nav aria-label="Footer navigation">{[...pages, { key: 'privacy' as CustomerPage, label: 'Privacy' }].map(item => <a key={item.key} href={route(item.key)}>{item.label}</a>)}</nav></div><div className="ub-footer-bottom ub-shell"><span>© 2026 {site.business.name}</span><a href="https://www.theredspectrum.com/">Website designed by Red Spectrum</a></div></footer>
    {myndyActive && <UniqueHomeMyndy agentId={site.myndy.embed.agentId} />}
   </div>;
}
