/**
 * Canonical site identity shared by metadata, the sitemap, robots.txt,
 * and structured data.
 */

function withoutTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

/**
 * Absolute production origin. Set NEXT_PUBLIC_SITE_URL to the real domain
 * (e.g. https://trainedright.com) — canonicals, the sitemap, and OG tags all
 * derive from it. On Vercel we fall back to the production deployment URL so
 * generated URLs are never localhost, even before the env var is set.
 */
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? withoutTrailingSlash(process.env.NEXT_PUBLIC_SITE_URL)
  : process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000";

export const siteName = "TrainedRight";

export const siteDescription =
  "Find fitness trainers, gym coaches, sports coaches, yoga instructors and dietitians across India. Compare verified reviews, real client transformations and prices, then chat directly on WhatsApp — free.";

/** Default document title (home + fallback for pages without their own). */
export const siteTitle =
  "TrainedRight — Find Fitness Trainers, Coaches & Dietitians in India";
