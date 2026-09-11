import Image from "next/image";
import { SwenzyWebsite } from "@/components/customers/swenzy-website";
import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowRight, Mail, Menu, Phone } from "lucide-react";

import { CustomerContactForm } from "@/components/customer-contact-form";
import type { CustomerPage, CustomerSite } from "@/lib/customers/schema";

type ThemeStyle = CSSProperties & Record<`--site-${string}`, string>;

function SiteLogo({ site }: { site: CustomerSite }) {
  if (site.branding.logoPath) return <Image src={site.branding.logoPath} alt={`${site.business.name} logo`} width={180} height={64} className="h-12 w-auto object-contain" />;
  return <span className="text-xl font-black">{site.business.name}</span>;
}

function SiteHeader({ site }: { site: CustomerSite }) {
  const root = `/${site.slug}`;
  const rounded = site.templateId === "stillwater";
  return <header className={rounded ? "relative z-20 mx-auto mt-5 max-w-6xl px-4" : "border-b border-current/20"}>
    <div className={`mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-5 px-5 ${rounded ? "rounded-full bg-white/95 shadow-lg" : ""}`}>
      <Link href={root} className="shrink-0"><SiteLogo site={site} /></Link>
      <nav aria-label={`${site.business.name} navigation`} className="hidden items-center gap-7 text-sm font-bold md:flex">
        <Link href={root}>Home</Link><Link href={`${root}/services`}>Services</Link><Link href={`${root}/about`}>About</Link><Link href={`${root}/contact`}>Contact</Link>
      </nav>
      <Link href={`${root}/contact`} className={`min-h-11 px-4 py-3 text-sm font-bold text-white ${rounded ? "rounded-full" : ""}`} style={{ backgroundColor: site.branding.primary }}>Request information</Link>
      <Menu className="md:hidden" aria-label="Navigation available through the contact action and page footer" />
    </div>
  </header>;
}

function SiteFooter({ site }: { site: CustomerSite }) {
  const root = `/${site.slug}`;
  return <footer className="border-t border-current/20 px-5 py-8"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 text-sm sm:flex-row"><p>© 2026 {site.business.name}. Website designed by <a className="font-bold underline underline-offset-4" href="https://www.theredspectrum.com/" target="_blank" rel="noreferrer">Red Spectrum</a>.</p><nav className="flex flex-wrap gap-5" aria-label="Footer"><Link href={root}>Home</Link><Link href={`${root}/services`}>Services</Link><Link href={`${root}/about`}>About</Link><Link href={`${root}/contact`}>Contact</Link><Link href={`${root}/privacy`}>Privacy</Link></nav></div></footer>;
}

function ForgeHome({ site }: { site: CustomerSite }) {
  const page = site.pages.home;
  return <><section className="mx-auto grid max-w-7xl overflow-hidden lg:grid-cols-[1.05fr_.95fr]"><div className="flex flex-col justify-center px-5 py-16 text-white lg:py-28" style={{ backgroundColor: site.branding.secondary }}><p className="text-sm font-black uppercase tracking-[.2em]" style={{ color: site.branding.accent }}>{page.eyebrow}</p><h1 className="mt-5 text-5xl font-black uppercase leading-[.92] tracking-[-.04em] sm:text-7xl">{page.headline}</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-white/75">{page.intro}</p><Link href={`/${site.slug}/contact`} className="mt-8 inline-flex w-fit min-h-12 items-center gap-3 px-6 py-4 font-black text-white" style={{ backgroundColor: site.branding.primary }}>{page.ctaLabel}<ArrowRight /></Link></div><div className="relative min-h-[440px]"><Image src={site.images.hero.src} alt={site.images.hero.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" priority /></div></section><ServicePreview site={site} /></>;
}

function LedgerHome({ site }: { site: CustomerSite }) {
  const page = site.pages.home;
  return <><section className="mx-auto grid max-w-7xl gap-10 px-5 py-14 lg:grid-cols-[1.3fr_.7fr] lg:py-24"><div><p className="text-xs font-bold uppercase tracking-[.24em]" style={{ color: site.branding.primary }}>{page.eyebrow}</p><h1 className="mt-7 text-5xl leading-[.98] tracking-[-.04em] sm:text-7xl lg:text-8xl" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>{page.headline}</h1><p className="mt-8 max-w-3xl border-t border-current/25 pt-6 text-lg leading-8">{page.intro}</p><Link href={`/${site.slug}/contact`} className="mt-7 inline-flex items-center gap-3 border-b-2 pb-1 font-bold" style={{ borderColor: site.branding.primary, color: site.branding.primary }}>{page.ctaLabel}<ArrowRight /></Link></div><Image src={site.images.hero.src} alt={site.images.hero.alt} width={site.images.hero.width} height={site.images.hero.height} className="h-[460px] w-full object-cover grayscale-[20%]" priority /></section><ServicePreview site={site} /></>;
}

function StillwaterHome({ site }: { site: CustomerSite }) {
  const page = site.pages.home;
  return <><section className="relative -mt-28 min-h-[760px] overflow-hidden"><Image src={site.images.hero.src} alt={site.images.hero.alt} fill sizes="100vw" className="object-cover" priority /><div className="absolute inset-0 bg-black/45" /><div className="relative mx-auto flex min-h-[760px] max-w-6xl items-end px-5 pb-20 pt-40"><div className="max-w-3xl text-white"><p className="text-sm font-bold uppercase tracking-[.2em]" style={{ color: site.branding.accent }}>{page.eyebrow}</p><h1 className="mt-5 text-5xl font-semibold leading-[.98] tracking-[-.04em] sm:text-7xl">{page.headline}</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-white/80">{page.intro}</p><Link href={`/${site.slug}/contact`} className="mt-8 inline-flex min-h-12 items-center gap-3 rounded-full px-6 py-4 font-bold text-white" style={{ backgroundColor: site.branding.primary }}>{page.ctaLabel}<ArrowRight /></Link></div></div></section><ServicePreview site={site} /></>;
}

function ServicePreview({ site }: { site: CustomerSite }) {
  return <section className="mx-auto max-w-7xl px-5 py-16"><p className="text-sm font-bold uppercase tracking-[.18em]" style={{ color: site.branding.primary }}>Services</p><h2 className="mt-3 max-w-3xl text-4xl font-black tracking-tight">{site.pages.services.headline}</h2><div className="mt-9 grid gap-4 md:grid-cols-3">{site.services.slice(0,3).map((service)=><article key={service.name} className={`border border-current/15 bg-white p-6 ${site.templateId === "stillwater" ? "rounded-[2rem]" : ""}`}><h3 className="text-2xl font-bold">{service.name}</h3><p className="mt-3 leading-7 opacity-70">{service.description}</p>{service.status === "draft" && <p className="mt-5 text-xs font-black uppercase tracking-wider text-amber-800">Draft content</p>}</article>)}</div></section>;
}

function InnerPage({ site, page }: { site: CustomerSite; page: Exclude<CustomerPage, "home"> }) {
  const root = `/${site.slug}`;
  const heading = site.pages[page].headline;
  return <main className="mx-auto max-w-6xl px-5 py-14 lg:py-24"><p className="text-sm font-bold uppercase tracking-[.18em]" style={{ color: site.branding.primary }}>{page}</p><h1 className="mt-4 max-w-4xl text-5xl font-black leading-[.98] tracking-[-.04em] sm:text-7xl">{heading}</h1>
    {page === "services" && <><p className="mt-7 max-w-3xl text-lg leading-8 opacity-75">{site.pages.services.intro}</p><div className="mt-12 grid gap-5 md:grid-cols-2">{site.services.map((service)=><article key={service.name} className="border-t-4 bg-white p-6" style={{ borderColor: site.branding.primary }}><h2 className="text-2xl font-bold">{service.name}</h2><p className="mt-3 leading-7 opacity-75">{service.description}</p>{service.status === "draft" && <p className="mt-5 text-xs font-black uppercase text-amber-800">Draft content</p>}</article>)}</div></>}
    {page === "about" && <div className="mt-10 max-w-3xl space-y-6 text-lg leading-8">{site.pages.about.paragraphs.map((paragraph)=><p key={paragraph}>{paragraph}</p>)}</div>}
    {page === "contact" && <div className="mt-10 grid gap-10 lg:grid-cols-[.7fr_1.3fr]"><aside className="space-y-5"><p className="text-lg leading-8 opacity-75">{site.pages.contact.intro}</p>{site.contact.phone.value && <a className="flex gap-3 font-bold" href={`tel:${site.contact.phone.value}`}><Phone />{site.contact.phone.value}</a>}{site.contact.email.value && <a className="flex gap-3 font-bold" href={`mailto:${site.contact.email.value}`}><Mail />{site.contact.email.value}</a>}{site.contact.address.value && <p>{site.contact.address.value}</p>}</aside><div className="bg-white p-5 text-slate-900 shadow-xl sm:p-8"><CustomerContactForm accent={site.branding.primary} customerSlug={site.slug} /></div></div>}
    {page === "privacy" && <div className="mt-10 max-w-3xl space-y-6 text-lg leading-8">{site.pages.privacy.body.map((paragraph)=><p key={paragraph}>{paragraph}</p>)}</div>}
    <div className="mt-16 border-t border-current/20 pt-6"><Link className="font-bold" href={root}>Back to home</Link></div>
  </main>;
}

export function CustomerWebsite({ site, page }: { site: CustomerSite; page: CustomerPage }) {
  if (site.slug === "swenzy-logistics") return <SwenzyWebsite site={site} page={page} />;
  const style: ThemeStyle = { backgroundColor: site.branding.surface, color: site.branding.secondary, "--site-primary": site.branding.primary };
  return <div className="min-h-screen" style={style}>
    {site.status !== "approved" && <div className="bg-amber-300 px-4 py-2 text-center text-xs font-black uppercase tracking-[.14em] text-slate-950">Customer preview · {site.status} content</div>}
    <SiteHeader site={site} />
    {page === "home" && site.templateId === "forge" && <ForgeHome site={site} />}
    {page === "home" && site.templateId === "ledger" && <LedgerHome site={site} />}
    {page === "home" && site.templateId === "stillwater" && <StillwaterHome site={site} />}
    {page !== "home" && <InnerPage site={site} page={page} />}
    <div id={`myndy-${site.slug}`} data-myndy-placeholder="true" data-agent-name={site.myndy.agentName} hidden />
    <SiteFooter site={site} />
  </div>;
}
