import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  if (process.env.VERCEL_ENV !== "production") return [];
  const origin = "https://webfactory.redspectrum.ai";
  return ["/", "/designs", "/privacy"].map((path) => ({
    url: `${origin}${path}`,
    changeFrequency: "monthly" as const,
  }));
}
