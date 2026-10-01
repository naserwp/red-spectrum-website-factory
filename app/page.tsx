import type { Metadata } from "next";
import { V2Home } from "@/components/webfactory/v2/public/home";

export const metadata: Metadata = { title: { absolute: "Red Spectrum WebFactory | Business Websites" }, description: "Explore designs, share your brief and review a custom website preview with Red Spectrum.", alternates: { canonical: "https://webfactory.redspectrum.ai" } };

export default function Home() { return <V2Home />; }
