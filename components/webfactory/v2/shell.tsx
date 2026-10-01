import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import "../webfactory.css";
import "./v2.css";

export function V2Shell({ children }: { children: ReactNode }) {
  const navigation = [["Home", "/"], ["Designs & previews", "/designs"], ["How it works", "/processing"], ["Request website", "/request"], ["Admin login", "/admin/login"]];
  return <div className="wf v2 v2-public">
    <a className="wf-skip" href="#content">Skip to content</a>
    <header className="v2-header">
      <div className="v2-header-inner">
        <Link className="v2-brand" href="/" aria-label="Red Spectrum WebFactory home"><Image src="/v2/brand/red-spectrum-wordmark-v2.png" width={236} height={58} alt="Red Spectrum WebFactory" priority /></Link>
        <details className="v2-mobile-nav"><summary>Menu</summary><nav aria-label="Mobile navigation">{navigation.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</nav></details>
        <nav className="v2-top-nav" aria-label="Public navigation">{navigation.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</nav>
        <Link className="v2-button v2-red v2-header-cta" href="/request">Start website request ↗</Link>
      </div>
    </header>
    <main id="content">{children}</main>
    <footer className="v2-footer"><Link href="/">RS WebFactory</Link><span>Thoughtful websites. Clear next steps.</span><nav aria-label="Footer navigation"><Link href="/designs#customer-previews">Customer previews</Link><Link href="/processing">How it works</Link><Link href="/privacy">Privacy</Link></nav></footer>
  </div>;
}
export function V2Intro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="v2-container v2-intro"><p className="v2-eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>;
}
