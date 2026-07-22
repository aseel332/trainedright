import type { NextRequest } from "next/server";
import { updateAuthSession } from "@/lib/server/auth-session";

export async function proxy(request: NextRequest) {
  return updateAuthSession(request);
}

export const config = {
  // Run on every page navigation so the auth session cookie stays fresh
  // wherever the trainer is browsing. Skip static assets, SEO metadata files
  // (sitemap/robots/manifest/icons), and the analytics beacon endpoint,
  // which never need a session.
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|api/track|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest)$).*)",
  ],
};
