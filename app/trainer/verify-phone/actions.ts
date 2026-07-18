"use server";

import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { createAdminSupabaseClient } from "@/lib/server/supabase-admin";
import { createAuthServerClient } from "@/lib/server/supabase-server";

/**
 * TEMPORARY on-screen OTP path, used while Twilio SMS is unavailable
 * (gated by NEXT_PUBLIC_OTP_DEV_MODE). The code is generated here, returned to
 * the browser to display, verified here, and the phone is marked confirmed via
 * the admin API — no SMS is ever sent. When real SMS works, turn the flag off
 * and the client falls back to the standard Supabase updateUser/verifyOtp flow.
 */

const COOKIE_NAME = "tr_phone_otp";
const CODE_TTL_MS = 10 * 60 * 1000;

type SendResult =
  | { ok: true; devCode: string }
  | { ok: false; error: string };

type VerifyResult = { ok: true } | { ok: false; error: string };

function devModeOn() {
  return process.env.NEXT_PUBLIC_OTP_DEV_MODE === "true";
}

function otpSecret() {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SECRET_KEY ??
    "trainedright-dev-otp"
  );
}

function hashCode(code: string, phone: string) {
  return createHmac("sha256", otpSecret())
    .update(`${code}:${phone}`)
    .digest("hex");
}

function isValidE164(phone: string) {
  return /^\+91[6-9]\d{9}$/.test(phone);
}

async function requireUserId() {
  const supabase = await createAuthServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function sendDevPhoneOtp(phone: string): Promise<SendResult> {
  if (!devModeOn()) {
    return { ok: false, error: "On-screen OTP mode is off." };
  }

  const userId = await requireUserId();
  if (!userId) {
    return { ok: false, error: "You need to be signed in." };
  }

  if (!isValidE164(phone)) {
    return { ok: false, error: "Enter a valid 10-digit mobile number." };
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const payload = JSON.stringify({
    uid: userId,
    phone,
    hash: hashCode(code, phone),
    exp: Date.now() + CODE_TTL_MS,
  });

  const store = await cookies();
  store.set(COOKIE_NAME, payload, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CODE_TTL_MS / 1000,
  });

  return { ok: true, devCode: code };
}

export async function verifyDevPhoneOtp(
  phone: string,
  code: string,
): Promise<VerifyResult> {
  if (!devModeOn()) {
    return { ok: false, error: "On-screen OTP mode is off." };
  }

  const userId = await requireUserId();
  if (!userId) {
    return { ok: false, error: "You need to be signed in." };
  }

  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) {
    return { ok: false, error: "That code has expired. Send a new one." };
  }

  let parsed: { uid?: string; phone?: string; hash?: string; exp?: number };
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "Something went wrong. Send a new code." };
  }

  if (parsed.uid !== userId || parsed.phone !== phone) {
    return { ok: false, error: "Send a new code for this number." };
  }

  if (!parsed.exp || Date.now() > parsed.exp) {
    store.delete(COOKIE_NAME);
    return { ok: false, error: "That code has expired. Send a new one." };
  }

  const expected = Buffer.from(parsed.hash ?? "", "hex");
  const actual = Buffer.from(hashCode(code.trim(), phone), "hex");
  if (
    expected.length === 0 ||
    expected.length !== actual.length ||
    !timingSafeEqual(expected, actual)
  ) {
    return { ok: false, error: "That code is not correct." };
  }

  const admin = createAdminSupabaseClient();
  if (!admin) {
    return { ok: false, error: "Server is not configured for verification." };
  }

  // Sets the phone and marks it confirmed (phone_confirmed_at) without SMS.
  const { error } = await admin.auth.admin.updateUserById(userId, {
    phone,
    phone_confirm: true,
  });
  if (error) {
    return { ok: false, error: error.message };
  }

  store.delete(COOKIE_NAME);
  return { ok: true };
}
