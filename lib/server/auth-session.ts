import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAuthConfig } from "@/lib/supabase-config";

/** Routes that require a signed-in trainer. */
const PROTECTED_PREFIXES = [
  "/trainer/dashboard",
  "/trainer/onboarding",
  "/trainer/verify-phone",
];

/** The sign-in / sign-up screen. Signed-in trainers are sent back out of it. */
const AUTH_PATH = "/trainer/auth";

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function safeNext(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/trainer/dashboard";
}

/**
 * Runs on every request (see proxy.ts): keeps the Supabase session cookie
 * fresh so the browser and server never disagree about the refresh token —
 * the classic cause of "refreshing the page logs me out" — and enforces the
 * trainer-area redirects.
 */
export async function updateAuthSession(request: NextRequest) {
  let config;
  try {
    config = getSupabaseAuthConfig();
  } catch {
    // Env not configured: never take the whole site down from the proxy.
    // Protected pages still guard themselves server-side.
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  // Every cookie written during this request (refreshed tokens), so redirect
  // responses can carry them too. Dropping a rotated refresh token here would
  // sign the trainer out on their next visit.
  const writtenCookies: {
    name: string;
    value: string;
    options?: Record<string, unknown>;
  }[] = [];

  const supabase = createServerClient(config.url, config.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
          writtenCookies.push({ name, value, options });
        });

        Object.entries(headers).forEach(([header, value]) => {
          response.headers.set(header, value);
        });
      },
    },
  });

  // Validates the JWT and refreshes the session when the access token has
  // expired. Do not run other logic between client creation and this call.
  let signedIn = false;
  let cookieIsCorrupt = false;

  try {
    const { data, error } = await supabase.auth.getClaims();
    signedIn = !error && Boolean(data?.claims);
  } catch {
    // A truncated, hand-edited, or foreign-project auth cookie makes
    // getClaims throw rather than return an error. Left unhandled that turns
    // into a 500 on *every* page for that browser, with no way out but
    // clearing site data by hand. Treat it as signed out and bin the cookie
    // so the next request is clean.
    cookieIsCorrupt = true;
  }

  /** The Supabase session cookies, including the `.0`/`.1` chunked halves. */
  function authCookieNames() {
    return request.cookies
      .getAll()
      .map((cookie) => cookie.name)
      .filter((name) => /^sb-.*-auth-token(\.\d+)?$/.test(name));
  }

  function withRecovery<T extends NextResponse>(target: T) {
    if (cookieIsCorrupt) {
      authCookieNames().forEach((name) => target.cookies.delete(name));
    }
    return target;
  }

  const { pathname, search } = request.nextUrl;

  function redirectWithCookies(url: URL) {
    const redirect = NextResponse.redirect(url);
    writtenCookies.forEach(({ name, value, options }) => {
      redirect.cookies.set(name, value, options);
    });
    return withRecovery(redirect);
  }

  if (!signedIn && isProtectedPath(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = AUTH_PATH;
    redirectUrl.search = "";
    redirectUrl.searchParams.set("mode", "signin");
    redirectUrl.searchParams.set("next", `${pathname}${search}`);
    return redirectWithCookies(redirectUrl);
  }

  if (signedIn && pathname === AUTH_PATH) {
    // Already signed in: the auth screen never shows again. This is also what
    // stops the browser back button from landing on a login form after
    // signing in — going back just bounces forward to the dashboard.
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = safeNext(request.nextUrl.searchParams.get("next"));
    redirectUrl.search = "";
    return redirectWithCookies(redirectUrl);
  }

  return withRecovery(response);
}
