import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "RS Website Factory", template: "%s | RS Website Factory" },
  description:
    "A verified-content production system for distinct, customer-ready business website previews.",
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
