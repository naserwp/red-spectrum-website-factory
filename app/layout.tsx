import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://webfactory.redspectrum.ai"),
  title: { default: "Red Spectrum WebFactory", template: "%s | Red Spectrum WebFactory" },
  description:
    "Explore website designs, share your business brief, and review your custom website with Red Spectrum WebFactory.",
  applicationName: "Red Spectrum WebFactory",
  openGraph: {
    type: "website",
    siteName: "Red Spectrum WebFactory",
    title: "Red Spectrum WebFactory | Business Websites",
    description: "Explore designs, share your business brief, and review a custom website preview.",
    url: "https://webfactory.redspectrum.ai",
    images: [{ url: "/v2/brand/red-spectrum-wordmark-v2.png", width: 2048, height: 682, alt: "Red Spectrum WebFactory" }],
  },
  twitter: { card: "summary_large_image" },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  robots: { index: process.env.VERCEL_ENV === "production", follow: process.env.VERCEL_ENV === "production" },
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
