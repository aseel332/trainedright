import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          // Consoles and auth flows
          "/admin",
          "/api/",
          "/auth/",
          "/trainer/auth",
          "/trainer/dashboard",
          "/trainer/onboarding",
          "/trainer/verify-phone",
          // One-time client token links (reviews / transformation uploads)
          "/review/",
          "/transform/",
          // Internal search result pages — canonical listings live on
          // /trainers and the profession/city landing pages instead.
          "/*?q=",
          "/*&q=",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
