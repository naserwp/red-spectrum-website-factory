"use client";

import { useState } from "react";

const areas = [
  "Marketing",
  "Consulting",
  "Advertising",
  "Real estate-related inquiry",
  "General business inquiry",
] as const;

export function UniqueHomeInquiryForm({ active }: { active: boolean }) {
  const [state, setState] = useState<"idle" | "sending" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!active || state === "sending") return;
    const form = event.currentTarget;
    setState("sending");
    setMessage("");
    try {
      const response = await fetch("/api/leads/unique-home-enterprise", { method: "POST", body: new FormData(form) });
      const body = (await response.json().catch(() => ({}))) as { ok?: unknown; message?: unknown };
      if (!response.ok || body.ok !== true) {
        setState("error");
        setMessage(typeof body.message === "string" && response.status !== 503 && response.status !== 500 ? body.message : "We couldn't submit your inquiry right now. Please try again or contact us directly.");
        return;
      }
      window.location.assign("/thank-you");
    } catch {
      setState("error");
      setMessage("We couldn't submit your inquiry right now. Please try again or contact us directly.");
    }
  }

  if (!active) {
    return <>
      <p>Online submission is not active on this preview. Please use the direct phone or email links.</p>
      <fieldset disabled>
        <label>Name<input name="name" autoComplete="off" /></label>
        <label>Email<input name="email" type="email" autoComplete="off" /></label>
        <label>Inquiry area<select name="area" defaultValue=""><option value="">Choose an area</option>{areas.map((area) => <option key={area}>{area}</option>)}</select></label>
        <label>Message<textarea name="message" rows={4} /></label>
        <button type="button">Online inquiry unavailable</button>
      </fieldset>
    </>;
  }

  return <form onSubmit={submit} noValidate>
    <input type="checkbox" name="botcheck" className="ub-honeypot" tabIndex={-1} autoComplete="off" aria-hidden="true" />
    <label>Name<input name="name" required minLength={2} maxLength={100} autoComplete="name" /></label>
    <label>Email<input name="email" type="email" required maxLength={200} autoComplete="email" /></label>
    <label>Inquiry area
      <select name="service" required defaultValue="">
        <option value="" disabled>Choose an area</option>
        {areas.map((area) => <option key={area} value={area}>{area}</option>)}
      </select>
    </label>
    <label>Message<textarea name="message" rows={4} required minLength={5} maxLength={3000} /></label>
    <label className="ub-consent"><input name="consent" type="checkbox" value="on" required /><span>I agree to be contacted regarding this inquiry.</span></label>
    <button type="submit" disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Send inquiry"}</button>
    {state === "error" && <p className="ub-form-error" role="alert">{message}</p>}
  </form>;
}
