import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  if (process.env.VERCEL_ENV !== "production") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/designs", "/privacy"],
      disallow: ["/admin", "/api", "/client", "/checkout", "/preview", "/request", "/processing"],
    },
    sitemap: "https://webfactory.redspectrum.ai/sitemap.xml",
  };
}
