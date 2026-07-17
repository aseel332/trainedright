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