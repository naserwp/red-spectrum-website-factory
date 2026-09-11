"use client";

import { useState } from "react";
import { Check, Download, FileJson, ShieldAlert } from "lucide-react";

import type { CustomerBrief, VerificationState } from "@/lib/factory/types";

const inputClass = "mt-2 min-h-11 w-full border border-slate-300 bg-white px-3 py-2 text-base outline-none focus:border-[#bd1e2c] focus:ring-2 focus:ring-red-100";

function evidence(form: FormData, name: string) {
  const value = String(form.get(name) ?? "").trim();
  const requested = String(form.get(`${name}Status`) ?? "draft") as VerificationState;
  return { value, status: value ? requested : "missing" as VerificationState, source: String(form.get(`${name}Source`) ?? "").trim() || undefined };
}

export function BriefBuilder() {
  const [json, setJson] = useState("");

  function buildBrief(formElement: HTMLFormElement) {
    const form = new FormData(formElement);
    const brief: CustomerBrief = {
      schemaVersion: "1.0",
      project: { businessName: String(form.get("businessName") ?? ""), slug: String(form.get("slug") ?? ""), industry: String(form.get("industry") ?? ""), templateId: String(form.get("templateId") ?? "") },
      contact: { phone: evidence(form, "phone"), email: evidence(form, "email"), address: evidence(form, "address") },
      content: { primaryService: evidence(form, "primaryService"), serviceAreas: evidence(form, "serviceAreas"), differentiators: evidence(form, "differentiators") },
      assets: { logoSupplied: form.get("logoSupplied") === "on", sourceWebsite: String(form.get("sourceWebsite") ?? ""), notes: String(form.get("notes") ?? "") },
      formDelivery: { provider: "sendgrid", mode: "disabled", recipientConfirmed: false, testPassed: false },
      approval: { approvedBy: "", approvedAt: "" },
    };
    const output = JSON.stringify(brief, null, 2);
    setJson(output);
    return { brief, output };
  }

  function download(formElement: HTMLFormElement) {
    const { brief, output } = buildBrief(formElement);
    const safeSlug = brief.project.slug.replace(/[^a-z0-9-]/gi, "-").toLowerCase() || "customer";
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([output], { type: "application/json" }));
    link.download = `${safeSlug}-brief.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <form className="grid gap-8" onSubmit={(event) => { event.preventDefault(); buildBrief(event.currentTarget); }}>
      <section className="border border-slate-300 bg-white p-5 sm:p-7" aria-labelledby="identity-heading">
        <p className="text-xs font-black uppercase tracking-[.16em] text-[#bd1e2c]">01 / Identity</p>
        <h2 id="identity-heading" className="mt-2 text-2xl font-black">Project identity</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="font-bold">Business name<input className={inputClass} name="businessName" required placeholder="Verified legal or public name" /></label>
          <label className="font-bold">Preview slug<input className={inputClass} name="slug" required pattern="[a-z0-9-]+" placeholder="business-name" /></label>
          <label className="font-bold">Industry<input className={inputClass} name="industry" required placeholder="e.g. Residential roofing" /></label>
          <label className="font-bold">Starting pattern<select className={inputClass} name="templateId" required defaultValue=""><option value="" disabled>Select a pattern</option><option value="forge">Forge &amp; Field</option><option value="ledger">Ledger &amp; Line</option><option value="stillwater">Stillwater</option></select></label>
          <label className="font-bold sm:col-span-2">Existing website URL<input className={inputClass} name="sourceWebsite" type="url" placeholder="https://" /></label>
          <label className="flex min-h-11 items-center gap-3 font-bold sm:col-span-2"><input className="h-5 w-5 accent-[#bd1e2c]" name="logoSupplied" type="checkbox" />Customer supplied a usable logo</label>
        </div>
      </section>

      <section className="border border-slate-300 bg-white p-5 sm:p-7" aria-labelledby="evidence-heading">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-xs font-black uppercase tracking-[.16em] text-[#bd1e2c]">02 / Evidence</p><h2 id="evidence-heading" className="mt-2 text-2xl font-black">Facts and sources</h2></div>
          <p className="flex max-w-md gap-2 bg-amber-50 p-3 text-sm leading-5 text-amber-900"><ShieldAlert className="shrink-0" size={18} /> Empty values become missing. Draft values must remain labeled in customer previews.</p>
        </div>
        <div className="mt-6 grid gap-7">
          {[
            ["phone", "Phone", "tel", "Customer email or current website"],
            ["email", "Customer email", "email", "Direct confirmation required for form delivery"],
            ["address", "Business address", "text", "Official listing or customer confirmation"],
            ["primaryService", "Primary service", "text", "Customer brief or current service page"],
            ["serviceAreas", "Service areas", "text", "Customer-confirmed cities or regions"],
            ["differentiators", "Differentiators", "text", "Do not turn opinions into factual claims"],
          ].map(([name, label, type, hint]) => (
            <fieldset key={name} className="grid gap-3 border-t border-slate-200 pt-5 lg:grid-cols-[1fr_160px_1fr] lg:items-end">
              <label className="font-bold">{label}<input className={inputClass} name={name} type={type} /></label>
              <label className="font-bold">Status<select className={inputClass} name={`${name}Status`} defaultValue="draft"><option value="verified">Verified</option><option value="draft">Draft</option><option value="missing">Missing</option></select></label>
              <label className="font-bold">Evidence source<input className={inputClass} name={`${name}Source`} placeholder={hint} /></label>
            </fieldset>
          ))}
        </div>
      </section>

      <section className="border border-slate-300 bg-white p-5 sm:p-7" aria-labelledby="notes-heading">
        <p className="text-xs font-black uppercase tracking-[.16em] text-[#bd1e2c]">03 / Direction</p>
        <h2 id="notes-heading" className="mt-2 text-2xl font-black">Assets and notes</h2>
        <label className="mt-5 block font-bold">Uploaded asset inventory, desired pages, tone, and constraints<textarea className={`${inputClass} min-h-36`} name="notes" placeholder="List filenames and what each source can verify. Never paste credentials." /></label>
      </section>

      <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-4 border border-slate-300 bg-[#101828] p-4 text-white shadow-2xl">
        <p className="flex items-center gap-2 text-sm"><Check size={18} className="text-red-300" />Recipient confirmation and live form delivery remain off.</p>
        <div className="flex gap-2"><button className="inline-flex min-h-11 items-center gap-2 border border-white/40 px-4 font-bold hover:bg-white/10" type="submit"><FileJson size={18} />Preview JSON</button><button className="inline-flex min-h-11 items-center gap-2 bg-[#bd1e2c] px-4 font-bold hover:bg-red-700" type="button" onClick={(event) => download(event.currentTarget.form!)}><Download size={18} />Download brief</button></div>
      </div>

      {json && <section aria-live="polite" className="overflow-hidden border border-slate-300 bg-[#0b1220] text-slate-100"><div className="border-b border-white/10 px-4 py-3 text-sm font-bold">Generated customer brief</div><pre className="max-h-[32rem] overflow-auto p-4 text-xs leading-5">{json}</pre></section>}
    </form>
  );
}
