"use client";

import { useState } from "react";

export function CustomerContactForm({ accent = "#bd1e2c", customerSlug }: { accent?: string; customerSlug?: string }) {
  const [state, setState] = useState<"idle" | "sending" | "success" | "error">("idle");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!customerSlug) { setState("error"); return; }
    setState("sending");
    const payload = new FormData(event.currentTarget);
    try {
      const response = await fetch(`/api/leads/${encodeURIComponent(customerSlug)}`, { method: "POST", body: payload });
      if (!response.ok) throw new Error("Submission failed");
      event.currentTarget.reset(); setState("success");
    } catch { setState("error"); }
  }

  const field = "min-h-12 w-full border border-current/25 bg-white/90 px-3 py-2 text-base text-slate-900 outline-none focus:ring-2";
  return <form onSubmit={submit} className="grid gap-4" aria-label="Quote request form">
    <input type="checkbox" name="botcheck" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
    <div className="grid gap-4 sm:grid-cols-2"><label className="font-bold">Name<input className={field} name="name" required autoComplete="name" /></label><label className="font-bold">Email<input className={field} name="email" type="email" required autoComplete="email" /></label></div>
    <div className="grid gap-4 sm:grid-cols-2"><label className="font-bold">Phone<input className={field} name="phone" type="tel" required autoComplete="tel" /></label><label className="font-bold">Requested service<input className={field} name="service" required /></label></div>
    <label className="font-bold">Message<textarea className={`${field} min-h-28`} name="message" required /></label>
    <label className="flex items-start gap-3 text-sm leading-5"><input className="mt-1 h-4 w-4 shrink-0" name="consent" type="checkbox" required />I consent to being contacted about this request. Message and data rates may apply; consent is not a condition of purchase.</label>
    <button disabled={state === "sending"} style={{ backgroundColor: accent }} className="min-h-12 px-5 font-bold text-white disabled:opacity-60">{state === "sending" ? "Sending…" : "Send request"}</button>
    {state === "success" && <p role="status" className="bg-emerald-50 p-3 text-sm font-bold text-emerald-900">Thanks—your request was sent successfully.</p>}
    {state === "error" && <p role="alert" className="bg-amber-50 p-3 text-sm font-bold text-amber-950">This form is not available yet. Please use the verified phone or email shown on this page.</p>}
  </form>;
}
