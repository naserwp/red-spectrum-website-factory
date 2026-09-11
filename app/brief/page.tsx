import type { Metadata } from "next";
import { BriefBuilder } from "@/components/brief-builder";
import { FactoryHeader } from "@/components/factory-header";

export const metadata: Metadata = { title: "Customer brief", description: "Create a verified, structured customer website brief." };

export default function BriefPage() {
  return <main className="min-h-screen bg-[#f5f6f8]"><FactoryHeader /><div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 lg:py-14"><p className="text-sm font-black uppercase tracking-[.16em] text-[#bd1e2c]">Standard intake</p><h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">Customer brief builder</h1><p className="mb-9 mt-4 max-w-3xl text-lg leading-8 text-slate-600">Create the evidence record that drives content, deployment, form activation, Myndy context, and final approval. This tool saves locally and sends nothing.</p><BriefBuilder /></div></main>;
}
