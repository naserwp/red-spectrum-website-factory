import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://preview.redspectrum.ai"),
  title: { default: "RS WebFactory Studio | Red Spectrum", template: "%s | Red Spectrum WebFactory" },
  description:
    "Launch customer websites faster with RS WebFactory, an AI-assisted website studio with a clear request, preview, and approval workflow.",
  applicationName: "RS WebFactory Studio",
  openGraph: {
    type: "website",
    siteName: "RS WebFactory Studio",
    title: "RS WebFactory Studio | Red Spectrum",
    description: "Launch customer websites faster with a clear request, brief, preview, and approval workflow.",
    url: "https://preview.redspectrum.ai",
    images: [{ url: "/v2/brand/red-spectrum-wordmark-v2.png", width: 2048, height: 682, alt: "Red Spectrum WebFactory Studio" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "RS WebFactory Studio | Red Spectrum",
    description: "Launch customer websites faster with a clear request, preview, and approval workflow.",
    images: ["/v2/brand/red-spectrum-wordmark-v2.png"],
  },
  icons: {
    icon: "/brand/red-spectrum/favicon.png",
    shortcut: "/brand/red-spectrum/favicon.png",
  },
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
