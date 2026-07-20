import "server-only";

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_SESSION_COOKIE = "tr_admin_session";

const SESSION_LIFETIME_MS = 12 * 60 * 60 * 1000;

function adminCredentials() {
  return {
    email: process.env.ADMIN_EMAIL ?? "",
    password: process.env.ADMIN_PASSWORD ?? "",
  };
}

export function adminIsConfigured() {
  const { email, password } = adminCredentials();
  return email.length > 0 && password.length > 0;
}

// Hash both sides so the comparison is constant-time regardless of length.
function safeEqual(a: string, b: string) {
  const digestA = createHash("sha256").update(a).digest();
  const digestB = createHash("sha256").update(b).digest();
  return timingSafeEqual(digestA, digestB);
}

export function verifyAdminCredentials(email: string, password: string) {
  const expected = adminCredentials();
  if (!expected.email || !expected.password) {
    return false;
  }

  const emailOk = safeEqual(
    email.trim().toLowerCase(),
    expected.email.toLowerCase(),
  );
  const passwordOk = safeEqual(password, expected.password);
  return emailOk && passwordOk;
}

function sessionSecret() {
  const { email, password } = adminCredentials();
  return (
    process.env.ADMIN_SESSION_SECRET ??
    createHash("sha256")
      .update(`trainedright-admin:${email}:${password}`)
      .digest("hex")
  );
}

function signExpiry(expiresAt: number) {
  return createHmac("sha256", sessionSecret())
    .update(`admin:${expiresAt}`)
    .digest("hex");
}

export function createAdminSessionToken() {
  const expiresAt = Date.now() + SESSION_LIFETIME_MS;
  return { value: `${expiresAt}.${signExpiry(expiresAt)}`, expiresAt };
}

export function verifyAdminSessionToken(token: string) {
  const [expiryPart, signature] = token.split(".");
  const expiresAt = Number(expiryPart);

  if (!signature || !Number.isFinite(expiresAt) || expiresAt < Date.now()) {
    return false;
  }

  return safeEqual(signExpiry(expiresAt), signature);
}

export async function hasAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  return token ? verifyAdminSessionToken(token) : false;
}

// In-memory brute-force throttle. The console has a single credential pair, so
// a global counter is enough: after too many failures in a window, sign-in is
// briefly locked regardless of which email was tried. State is per-instance,
// which is acceptable for slowing down guessing.
const MAX_FAILURES = 8;
const LOCKOUT_MS = 15 * 60 * 1000;

let failureCount = 0;
let windowStartedAt = 0;
let lockedUntil = 0;

/** Seconds remaining on a lockout, or 0 when sign-in is allowed. */
export function adminLoginLockoutSeconds(now = Date.now()) {
  return lockedUntil > now ? Math.ceil((lockedUntil - now) / 1000) : 0;
}

/** Record a failed attempt; locks sign-in once the threshold is crossed. */
export function registerAdminLoginFailure(now = Date.now()) {
  if (now - windowStartedAt > LOCKOUT_MS) {
    windowStartedAt = now;
    failureCount = 0;
  }
  failureCount += 1;
  if (failureCount >= MAX_FAILURES) {
    lockedUntil = now + LOCKOUT_MS;
    failureCount = 0;
    windowStartedAt = now;
  }
}

/** Clear the throttle after a successful sign-in. */
export function resetAdminLoginFailures() {
  failureCount = 0;
  windowStartedAt = 0;
  lockedUntil = 0;
}