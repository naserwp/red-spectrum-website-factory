import Image from "next/image";
import Link from "next/link";
import { Inter, Poppins } from "next/font/google";
import "./webfactory.css";
import "./public-experience.css";
const inter = Inter({ subsets: ["latin"], variable: "--wf-body" });
const poppins = Poppins({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--wf-heading" });
export function WebFactoryShell({ children }: { children: React.ReactNode }) {
  return <div className={`wf ${inter.variable} ${poppins.variable}`}>
    <a className="wf-skip" href="#content">Skip to content</a>
    <header className="wf-header">
      <div className="wf-wrap wf-nav">
        <Link className="wf-brand-link" href="/" aria-label="Red Spectrum WebFactory home">
          <Image src="/brand/red-spectrum/logo-light.png" width={758} height={199} alt="Red Spectrum" className="wf-parent-logo" priority />
          <span className="wf-product">WebFactory</span>
        </Link>
        <nav aria-label="Main navigation">
          <Link href="/designs">Designs</Link>
          <Link href="/processing">How it works</Link>
          <Link href="/admin/login">Admin login</Link>
          <Link className="wf-button" href="/request">Start your website <span aria-hidden="true">↗</span></Link>
        </nav>
        <details className="wf-mobile">
          <summary aria-label="Open navigation menu"><span>Menu</span><span aria-hidden="true">☰</span></summary>
          <nav aria-label="Mobile navigation">
            <Link href="/">Home</Link><Link href="/designs">Designs</Link>
            <Link href="/processing">How it works</Link><Link href="/request">Start your website</Link>
            <Link href="/checkout">Payment & review</Link><Link href="/admin/login">Admin login</Link>
          </nav>
        </details>
      </div>
    </header>
    <main id="content">{children}</main>
    <footer className="wf-footer wf-wrap">
      <div className="wf-footer-top">
        <Link className="wf-lockup" href="/"><Image src="/brand/webfactory/mark.svg" alt="" width={38} height={38}/><strong>RS WebFactory</strong></Link>
        <p>A clearer path from business idea<br/>to a website you’re proud to share.</p>
        <nav aria-label="Footer navigation"><Link href="/designs">Designs</Link><Link href="/request">Request a website</Link><Link href="/processing">How it works</Link><Link href="/checkout">Payment & review</Link><Link href="/privacy">Privacy</Link><Link href="/admin/login">Admin login</Link></nav>
      </div>
      <div className="wf-footer-bottom"><span>© 2026 RS WebFactory. Website designed by <a href="https://www.theredspectrum.com/">Red Spectrum</a>.</span><span>Simple solutions. Brighter business.</span></div>
    </footer>
  </div>;
}
export function PageIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) { return <div className="wf-wrap wf-intro"><p className="wf-eyebrow">{eyebrow}</p><h1>{title}</h1><p className="wf-lead">{description}</p></div>; }
