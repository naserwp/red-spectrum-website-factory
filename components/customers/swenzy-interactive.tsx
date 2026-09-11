"use client";
import Link from "next/link";
import Script from "next/script";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
const root = "/swenzy-logistics";
export function SwenzyNav({ page }: { page: string }) {
  const [open, setOpen] = useState(false);
  return <><button className="sw-menu" aria-expanded={open} aria-controls="sw-navigation" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
    <nav id="sw-navigation" className={open ? "sw-nav is-open" : "sw-nav"} aria-label="Main navigation" onKeyDown={event => { if (event.key === "Escape") setOpen(false); }}>
      {["home", "services", "about", "contact"].map(item => <Link key={item} href={root + (item === "home" ? "" : "/" + item)} aria-current={page === item ? "page" : undefined} onClick={() => setOpen(false)}>{item}</Link>)}
      <Link href={root + "/contact#inquiry"} className="sw-button sw-nav-cta" onClick={() => setOpen(false)}>Start an inquiry <ArrowUpRight size={17}/></Link>
    </nav></>;
}
export function SwenzyForm({ mode }: { mode: "disabled" | "test" | "live" }) {
  const [state, setState] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === "disabled" || state === "sending") return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const details = ["company", "pickup", "destination", "shipment", "size", "date", "callback"].map(key => key + ": " + String(data.get(key) || "Not provided")).join("\n");
    data.set("message", details + "\n\n" + String(data.get("message") || ""));
    if (String(data.get("message")).length > 3000) { setState("error"); setMessage("Please shorten your shipment details."); return; }
    setState("sending"); setMessage("");
    try {
      const response = await fetch("/api/leads/swenzy-logistics", { method: "POST", body: data });
      const result = await response.json();
      if (!response.ok || !result || typeof result !== "object" || !("ok" in result) || result.ok !== true) throw new Error("Submission unsuccessful");
      setState("success"); setMessage("Your inquiry was accepted for processing. A quote or booking is not confirmed."); form.reset();
    } catch { setState("error"); setMessage("Your inquiry could not be submitted. Please try again later or contact Swenzy by phone or email."); }
  }
  return <form className="sw-form" onSubmit={submit} aria-label="Transportation inquiry">
    <div className="sw-form-heading"><span className="sw-kicker">Shipment details</span><h2>Start with the essentials.</h2></div>
    {mode !== "live" && <p className="sw-form-notice" id="form-status">{mode === "disabled" ? "Preview only — form delivery is not active. Please call or email for an inquiry." : "Internal testing only — submissions go to the authorized test inbox, not Swenzy Logistics."}</p>}
    <div className="sw-fields">
      <label>Your name *<input name="name" autoComplete="name" required minLength={2} maxLength={100}/></label>
      <label>Company<input name="company" autoComplete="organization" maxLength={100}/></label>
      <label>Email *<input name="email" type="email" autoComplete="email" required maxLength={200}/></label>
      <label>Phone *<input name="phone" type="tel" autoComplete="tel" required minLength={7} maxLength={40}/></label>
      <label className="sw-wide">Requested service *<select name="service" required defaultValue=""><option value="" disabled>Select an inquiry type</option><option>Transportation inquiry</option><option>Quote request</option><option>General question</option></select></label>
      <label>Pickup location<input name="pickup" placeholder="City, state" maxLength={150}/></label>
      <label>Drop-off location<input name="destination" placeholder="City, state" maxLength={150}/></label>
      <label>Shipment type<input name="shipment" placeholder="What needs to move?" maxLength={150}/></label>
      <label>Approximate size / weight<input name="size" placeholder="Include units, if known" maxLength={150}/></label>
      <label>Requested date<input name="date" type="date"/></label>
      <label>Preferred callback<select name="callback"><option>Email</option><option>Phone</option></select></label>
      <label className="sw-wide">Message *<textarea name="message" required minLength={5} maxLength={1800} rows={4} placeholder="Share any access requirements or questions."/></label>
    </div>
    <div className="sw-honeypot" aria-hidden="true"><label>Leave empty<input name="botcheck" tabIndex={-1} autoComplete="off"/></label></div>
    <label className="sw-consent"><input type="checkbox" name="consent" required/><span>I agree to the use of these details to respond to my inquiry, as described in the <Link href={root + "/privacy"}>Privacy Policy</Link>. This is not a booking confirmation.</span></label>
    <button className="sw-button" type="submit" disabled={mode === "disabled" || state === "sending"} aria-describedby={mode !== "live" ? "form-status" : undefined}>{mode === "disabled" ? "Delivery pending setup" : state === "sending" ? "Submitting…" : "Send inquiry"}<ArrowUpRight size={19}/></button>
    <p role="status" aria-live="polite" className={state === "error" ? "sw-error" : "sw-success"}>{message}</p>
  </form>;
}
export function SwenzyMyndy({ agentId, scriptUrl }: { agentId: string; scriptUrl: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const widget = document.createElement("myndy-convai");
    widget.setAttribute("agent_id", agentId);
    host.current?.appendChild(widget);
    let disposed = false;
    let observer: MutationObserver | undefined;
    void customElements.whenDefined("myndy-convai").then(() => {
      if (disposed || !widget.shadowRoot) return;
      const style = document.createElement("style");
      style.dataset.swenzyAccessibility = "true";
      style.textContent = "@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}} @media(max-width:435px){input{font-size:16px!important}}";
      widget.shadowRoot.appendChild(style);
      // The vendor has a legacy unrelated brand in its default avatar alt.
      // Correct that local accessibility label; never change provider knowledge.
      const labelAvatar = () => widget.shadowRoot?.querySelectorAll('img[alt="factiiv Logo"]').forEach(image => image.setAttribute("alt", "Swenzy Logistics AI assistant"));
      labelAvatar();
      observer = new MutationObserver(labelAvatar);
      observer.observe(widget.shadowRoot, { childList: true, subtree: true });
    });
    return () => {
      disposed = true;
      observer?.disconnect();
      // The vendor disconnectedCallback unmounts its React root.
      widget.remove();
      document.getElementById("swenzy-myndy-script")?.remove();
    };
  }, [agentId]);
  return <><div ref={host} data-myndy-tenant="swenzy-logistics" />
    <Script id="swenzy-myndy-script" src={scriptUrl} type="module" async strategy="afterInteractive" onError={() => setFailed(true)} />
    {failed && <p className="sw-widget-error" role="status">The AI assistant is unavailable. Please use the Contact page.</p>}
  </>;
}
