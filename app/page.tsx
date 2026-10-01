import type { Metadata } from "next";
import { V2Home } from "@/components/webfactory/v2/public/home";

export const metadata: Metadata = {
  title: { absolute: "RS WebFactory Studio | Red Spectrum" },
  description: "Launch customer websites faster with RS WebFactory, an AI-assisted website studio with a clear request, brief, preview, and approval workflow.",
  alternates: { canonical: "https://preview.redspectrum.ai" },
};

export default function Home() { return <V2Home />; }
