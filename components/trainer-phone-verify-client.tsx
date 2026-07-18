"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, KeyRound, Loader2, Phone, ShieldCheck } from "lucide-react";
import { createAuthBrowserClient } from "@/lib/client/supabase-browser";
import { sendDevPhoneOtp, verifyDevPhoneOtp } from "@/app/trainer/verify-phone/actions";

const DIAL_CODE = "+91";
const RESEND_SECONDS = 30;
const OTP_LENGTH = 6;

// TEMPORARY: while Twilio SMS is down, show the OTP on screen instead of
// sending it. Flip NEXT_PUBLIC_OTP_DEV_MODE off to use the real SMS flow.
const DEV_MODE = process.env.NEXT_PUBLIC_OTP_DEV_MODE === "true";

/** India mobile numbers: 10 digits starting 6–9. */
function isValidNationalNumber(value: string) {
  return /^[6-9]\d{9}$/.test(value);
}

function toE164(nationalNumber: string) {
  return `${DIAL_CODE}${nationalNumber}`;
}

function formatSendError(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("provider") ||
    normalized.includes("not configured") ||
    normalized.includes("sms") ||
    normalized.includes("unsupported phone")
  ) {
    return "SMS verification isn't available right now. Please try again later or contact support.";
  }

  if (normalized.includes("too many") || normalized.includes("rate")) {
    return "Too many attempts. Please wait a minute and try again.";
  }

  if (normalized.includes("already been registered") || normalized.includes("already registered")) {
    return "That number is already linked to another account.";
  }

  return message;
}

function formatVerifyError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("expired")) {
    return "That code has expired. Send a new one.";
  }

  if (normalized.includes("invalid") || normalized.includes("token")) {
    return "That code is not correct. Check it and try again.";
  }

  if (normalized.includes("too many") || normalized.includes("rate")) {
    return "Too many attempts. Please wait a minute and try again.";
  }

  return message;
}

export function TrainerPhoneVerifyClient() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [nationalNumber, setNationalNumber] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [resendLockedUntil, setResendLockedUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  const resendSeconds = Math.max(
    0,
    Math.ceil((resendLockedUntil - now) / 1000),
  );

  useEffect(() => {
    if (!resendLockedUntil) {
      return;
    }

    const interval = window.setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);
      if (currentTime >= resendLockedUntil) {
        window.clearInterval(interval);
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [resendLockedUntil]);

  function lockResend() {
    setNow(Date.now());
    setResendLockedUntil(Date.now() + RESEND_SECONDS * 1000);
  }

  // Returns an error message, or null on success. In dev mode the returned
  // code is surfaced on screen; the real SMS flow returns nothing to show.
  async function sendCode(
    targetE164: string,
  ): Promise<{ error: string | null; devCode: string | null }> {
    if (DEV_MODE) {
      const result = await sendDevPhoneOtp(targetE164);
      return result.ok
        ? { error: null, devCode: result.devCode }
        : { error: result.error, devCode: null };
    }

    const supabase = createAuthBrowserClient();
    // Attaches the phone to the signed-in auth user and sends an OTP to it.
    const { error: sendError } = await supabase.auth.updateUser({
      phone: targetE164,
    });
    return {
      error: sendError ? formatSendError(sendError.message) : null,
      devCode: null,
    };
  }

  async function handleSend() {
    if (busy) {
      return;
    }

    if (!isValidNationalNumber(nationalNumber)) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }

    setBusy(true);
    setError(null);
    setNotice(null);

    const targetE164 = toE164(nationalNumber);
    const { error: sendError, devCode: nextDevCode } = await sendCode(targetE164);

    if (sendError) {
      setError(sendError);
      setBusy(false);
      return;
    }

    setSentTo(targetE164);
    setDevCode(nextDevCode);
    setCode(nextDevCode ?? "");
    setStep("code");
    setNotice(
      nextDevCode ? null : "We sent a 6-digit code to your phone.",
    );
    lockResend();
    setBusy(false);
  }

  async function handleResend() {
    if (busy || resendSeconds > 0 || !sentTo) {
      return;
    }

    setBusy(true);
    setError(null);
    setNotice(null);

    const { error: sendError, devCode: nextDevCode } = await sendCode(sentTo);

    if (sendError) {
      setError(sendError);
      setBusy(false);
      return;
    }

    setDevCode(nextDevCode);
    setCode(nextDevCode ?? "");
    setNotice(nextDevCode ? null : "We sent a new code.");
    lockResend();
    setBusy(false);
  }

  async function handleVerify() {
    if (busy) {
      return;
    }

    if (code.trim().length !== OTP_LENGTH) {
      setError(`Enter the ${OTP_LENGTH}-digit code.`);
      return;
    }

    setBusy(true);
    setError(null);
    setNotice(null);

    if (DEV_MODE) {
      const result = await verifyDevPhoneOtp(sentTo, code.trim());
      if (!result.ok) {
        setError(formatVerifyError(result.error));
        setBusy(false);
        return;
      }
    } else {
      const supabase = createAuthBrowserClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone: sentTo,
        token: code.trim(),
        type: "phone_change",
      });

      if (verifyError) {
        setError(formatVerifyError(verifyError.message));
        setBusy(false);
        return;
      }
    }

    // Phone confirmed — the onboarding gate will now let this trainer through.
    router.replace("/trainer/onboarding");
    router.refresh();
  }

  function changeNumber() {
    setStep("phone");
    setCode("");
    setDevCode(null);
    setError(null);
    setNotice(null);
    setResendLockedUntil(0);
  }

  return (
    <main className="min-h-screen bg-background text-white">
      <div className="flex min-h-screen flex-col px-5 py-6 sm:px-10">
        <header className="flex items-center justify-between gap-4">
          <Link
            href="/trainer"
            className="font-display text-[20px] font-black leading-none text-white"
          >
            TRAINED<span className="text-brand">RIGHT</span>
          </Link>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="inline-flex items-center gap-2 text-sm font-extrabold text-soft transition hover:text-white"
            >
              <ArrowLeft aria-hidden="true" size={16} />
              Sign out
            </button>
          </form>
        </header>

        <section className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center py-12">
          <span className="grid h-13 w-13 place-items-center rounded-[16px] bg-brand/15 p-3 text-brand-light">
            <ShieldCheck aria-hidden="true" size={26} />
          </span>

          <h1 className="mt-6 font-display text-[36px] font-black leading-none text-white sm:text-[40px]">
            {step === "phone" ? "Verify your phone." : "Enter the code."}
          </h1>
          <p className="mt-4 text-sm font-semibold leading-6 text-soft">
            {step === "phone"
              ? "Confirm your mobile number to keep your coach account secure. This is the first step before setting up your profile."
              : devCode
                ? `SMS is temporarily unavailable, so your code for ${sentTo} is shown below. Enter it to confirm your number.`
                : `We sent a ${OTP_LENGTH}-digit code to ${sentTo}. Enter it below to confirm your number.`}
          </p>

          {step === "phone" ? (
            <form
              className="mt-7 space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void handleSend();
              }}
            >
              <label className="block">
                <span className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted">
                  Mobile number
                </span>
                <span className="relative mt-2 flex items-center rounded-[14px] border border-white/10 bg-panel focus-within:border-brand">
                  <span className="flex h-[52px] items-center gap-2 border-r border-white/10 pl-4 pr-3 text-[15px] font-bold text-soft">
                    <Phone aria-hidden="true" size={17} className="text-muted" />
                    {DIAL_CODE}
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={nationalNumber}
                    onChange={(event) =>
                      setNationalNumber(
                        event.target.value.replace(/\D/g, "").slice(0, 10),
                      )
                    }
                    className="h-[52px] w-full rounded-r-[14px] bg-transparent px-4 text-[15px] font-semibold text-white outline-none placeholder:text-muted"
                    placeholder="98765 43210"
                    autoComplete="tel-national"
                    autoFocus
                  />
                </span>
              </label>

              {error ? (
                <p className="rounded-[12px] border border-brand/25 bg-brand/10 px-4 py-3 text-[12px] font-semibold leading-5 text-soft">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={busy || !isValidNationalNumber(nationalNumber)}
                className="flex h-[54px] w-full items-center justify-center gap-2 rounded-[14px] bg-brand px-4 text-sm font-extrabold text-white transition enabled:hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-muted"
              >
                {busy ? (
                  <Loader2 aria-hidden="true" size={18} className="animate-spin" />
                ) : null}
                Send code
              </button>
            </form>
          ) : (
            <form
              className="mt-7 space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void handleVerify();
              }}
            >
              {devCode ? (
                <div className="flex items-center gap-3 rounded-[14px] border border-amber-400/30 bg-amber-500/10 px-4 py-3">
                  <KeyRound
                    aria-hidden="true"
                    size={20}
                    className="flex-none text-amber-300"
                  />
                  <div className="min-w-0">
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-amber-300/90">
                      Your code (SMS is off)
                    </p>
                    <p className="font-display text-[24px] font-black tracking-[0.35em] text-white">
                      {devCode}
                    </p>
                  </div>
                </div>
              ) : null}

              <label className="block">
                <span className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted">
                  Verification code
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={code}
                  onChange={(event) =>
                    setCode(
                      event.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH),
                    )
                  }
                  className="mt-2 h-[56px] w-full rounded-[14px] border border-white/10 bg-panel px-4 text-center text-[24px] font-black tracking-[0.5em] text-white outline-none transition placeholder:tracking-normal placeholder:text-muted focus:border-brand"
                  placeholder="000000"
                  autoComplete="one-time-code"
                  autoFocus
                />
              </label>

              {notice && !error ? (
                <p className="rounded-[12px] border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-[12px] font-semibold leading-5 text-emerald-200">
                  {notice}
                </p>
              ) : null}

              {error ? (
                <p className="rounded-[12px] border border-brand/25 bg-brand/10 px-4 py-3 text-[12px] font-semibold leading-5 text-soft">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={busy || code.trim().length !== OTP_LENGTH}
                className="flex h-[54px] w-full items-center justify-center gap-2 rounded-[14px] bg-brand px-4 text-sm font-extrabold text-white transition enabled:hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-muted"
              >
                {busy ? (
                  <Loader2 aria-hidden="true" size={18} className="animate-spin" />
                ) : null}
                Verify and continue
              </button>

              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={changeNumber}
                  disabled={busy}
                  className="text-[13px] font-extrabold text-soft transition hover:text-white disabled:opacity-60"
                >
                  Change number
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={busy || resendSeconds > 0}
                  className="text-[13px] font-extrabold text-brand-light transition enabled:hover:text-brand disabled:cursor-not-allowed disabled:text-muted"
                >
                  {resendSeconds > 0 ? `Resend in ${resendSeconds}s` : "Resend code"}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
