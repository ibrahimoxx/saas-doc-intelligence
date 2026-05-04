import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://docpilot.ai";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login"],
        disallow: ["/dashboard", "/documents", "/chat", "/membres", "/espaces", "/admin", "/invite"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
