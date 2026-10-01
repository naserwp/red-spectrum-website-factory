import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import "../webfactory.css";
import "./v2.css";

export function V2Shell({ children, area = "public" }: { children: ReactNode; area?: "public" | "admin" | "client" }) {
  const navigation = area === "admin"
    ? [["Overview", "/admin"], ["Requests", "/admin/requests"], ["AI workspace", "/admin/ai"], ["Designs", "/admin/designs"], ["Production", "/admin/production"], ["Delivery", "/admin/delivery"], ["Activity", "/admin/activity"], ["Settings", "/admin/settings"], ["Users", "/admin/users"], ["Integration", "/admin/integration"]]
    : area === "client"
      ? [["Overview", "/client"], ["Projects", "/client/projects"], ["Messages", "/client/messages"], ["Files", "/client/files"], ["Profile", "/client/profile"]]
      : [["Home", "/"], ["Designs gallery", "/designs"], ["How it works", "/processing"], ["Request website", "/request"], ["Client area", "/client/login"]];
  return <div className={`wf v2 v2-${area}`}>
    <a className="wf-skip" href="#content">Skip to content</a>
    <header className="v2-header">
      <div className="v2-header-inner">
        <Link className="v2-brand" href="/" aria-label="Red Spectrum WebFactory home"><Image src="/v2/brand/red-spectrum-wordmark-v2.png" width={236} height={58} alt="Red Spectrum WebFactory" priority /></Link>
        <details className="v2-mobile-nav"><summary>Menu</summary><nav aria-label="Mobile navigation">{navigation.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</nav></details>
        <nav className="v2-top-nav" aria-label={`${area} navigation`}>{navigation.slice(0, area === "public" ? 5 : 4).map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</nav>
        {area === "public" && <Link className="v2-button v2-red v2-header-cta" href="/request">Start website request ↗</Link>}
        {area === "admin" && <Link className="v2-button v2-quiet v2-header-cta" href="/admin/login">Admin portal</Link>}
      </div>
    </header>
    <div className={area === "public" ? undefined : "v2-workspace"}>
      {area !== "public" && <aside className="v2-sidebar"><p className="v2-sidebar-label">{area === "admin" ? "ADMIN WORKSPACE" : "CLIENT AREA"}</p><nav aria-label={`${area} sections`}>{navigation.map(([label, href]) => <Link key={href} href={href}>{label}<span aria-hidden>↗</span></Link>)}</nav><div className="v2-sidebar-note">{area === "admin" ? "Actions remain subject to server authorization and workflow checks." : "Access is limited to the request saved in this browser; permanent accounts are pending."}</div></aside>}
      <main id="content" className={area === "public" ? undefined : "v2-main"}>{children}</main>
    </div>
    <footer className="v2-footer"><Link href="/">RS WebFactory</Link><span>Thoughtful websites. Clear next steps.</span><nav aria-label="Footer navigation"><Link href="/designs">Designs</Link><Link href="/processing">Processing</Link><Link href="/checkout">Payment & review</Link><Link href="/privacy">Privacy</Link></nav></footer>
  </div>;
}

export function V2Intro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="v2-container v2-intro"><p className="v2-eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>;
}

export function AdminShell({ children }: { children: ReactNode }) { return <V2Shell area="admin">{children}</V2Shell>; }
export function ClientShell({ children }: { children: ReactNode }) { return <V2Shell area="client">{children}</V2Shell>; }
