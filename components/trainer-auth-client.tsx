"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Lock,
  LogIn,
  Mail,
  MailCheck,
  RefreshCw,
  Star,
  UserRound,
} from "lucide-react";
import { createAuthBrowserClient } from "@/lib/client/supabase-browser";

type AuthMode = "signin" | "signup";

const panelImage =
  "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=1200";

function normalizeNext(value: string) {
  return value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/trainer/dashboard";
}

function buildCallbackUrl(next: string) {
  const callbackUrl = new URL("/auth/callback", window.location.origin);
  callbackUrl.searchParams.set("next", next);
  return callbackUrl.toString();
}

function formatAuthError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("too many") || normalized.includes("rate")) {
    return "Too many attempts. Please wait a minute and try again.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Confirm your email before logging in.";
  }

  if (normalized.includes("invalid login")) {
    return "That email and password do not match.";
  }

  return message;
}

function callbackMessage(error?: string) {
  if (!error) {
    return null;
  }

  if (error === "auth_callback_failed") {
    return "That confirmation link expired or was already used.";
  }

  return "We could not complete that sign in. Please try again.";
}

export function TrainerAuthClient({
  initialMode,
  next,
  callbackError,
}: {
  initialMode: AuthMode;
  next: string;
  callbackError?: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [trainerName, setTrainerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(
    callbackMessage(callbackError),
  );
  const [busy, setBusy] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const [resendLockedUntil, setResendLockedUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const safeNext = normalizeNext(next);
  const resendSeconds = Math.max(
    0,
    Math.ceil((resendLockedUntil - now) / 1000),
  );
  const canSubmit =
    !busy &&
    email.trim().length > 0 &&
    password.length > 0 &&
    (mode === "signin" || trainerName.trim().length > 0);

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

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setStatus(null);
    setConfirmationEmail(null);
    setPassword("");
  }

  function showConfirmation(
    nextEmail: string,
    message: string,
    lockResend = true,
  ) {
    setConfirmationEmail(nextEmail);
    setStatus(message);
    setPassword("");
    setNow(Date.now());
    setResendLockedUntil(lockResend ? Date.now() + 30000 : 0);
  }

  async function handleEmailAuth() {
    if (!canSubmit) {
      return;
    }

    setBusy(true);
    setStatus(null);

    const supabase = createAuthBrowserClient();
    const normalizedEmail = email.trim();

    const response =
      mode === "signup"
        ? await supabase.auth.signUp({
            email: normalizedEmail,
            password,
            options: {
              emailRedirectTo: buildCallbackUrl(safeNext),
              data: {
                role: "trainer",
                full_name: trainerName.trim(),
              },
            },
          })
        : await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password,
          });

    if (response.error) {
      if (response.error.message.toLowerCase().includes("email not confirmed")) {
        showConfirmation(
          normalizedEmail,
          "Confirm your email before logging in.",
          false,
        );
      } else {
        setStatus(formatAuthError(response.error.message));
      }
      setBusy(false);
      return;
    }

    if (mode === "signup" && !response.data.session) {
      showConfirmation(normalizedEmail, "Confirmation email sent.");
      setBusy(false);
      return;
    }

    router.replace(safeNext);
    router.refresh();
  }

  async function handleGoogleAuth() {
    setBusy(true);
    setStatus(null);

    const supabase = createAuthBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: buildCallbackUrl(safeNext),
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      setStatus(formatAuthError(error.message));
      setBusy(false);
    }
  }

  async function handleResendConfirmation() {
    if (!confirmationEmail || resendSeconds > 0) {
      return;
    }

    setResendBusy(true);
    setStatus(null);

    const supabase = createAuthBrowserClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: confirmationEmail,
      options: {
        emailRedirectTo: buildCallbackUrl(safeNext),
      },
    });

    if (error) {
      setStatus(formatAuthError(error.message));
    } else {
      const lockUntil = Date.now() + 30000;
      setNow(Date.now());
      setResendLockedUntil(lockUntil);
      setStatus("Confirmation email sent again.");
    }

    setResendBusy(false);
  }

  return (
    <main className="min-h-screen bg-background text-white lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)]">
      {/* Form column */}
      <div className="relative flex min-h-screen flex-col px-5 py-6 sm:px-10">
        <header className="flex items-center justify-between gap-4">
          <Link
            href="/trainer"
            className="font-display text-[20px] font-black leading-none text-white"
          >
            TRAINED<span className="text-brand">RIGHT</span>
          </Link>
          <Link
            href="/trainer"
            className="inline-flex items-center gap-2 text-sm font-extrabold text-soft transition hover:text-white"
          >
            <ArrowLeft aria-hidden="true" size={16} />
            Back
          </Link>
        </header>

        <section className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-12">
          {confirmationEmail ? (
            <div>
              <span className="grid h-13 w-13 place-items-center rounded-[16px] bg-brand/15 p-3 text-brand-light">
                <MailCheck aria-hidden="true" size={26} />
              </span>
              <h1 className="mt-6 font-display text-[40px] font-black leading-none text-white">
                Check your email.
              </h1>
              <p className="mt-4 text-sm font-semibold leading-6 text-soft">
                We sent a confirmation link to{" "}
                <span className="text-white">{confirmationEmail}</span>.
              </p>

              {status ? (
                <p className="mt-5 rounded-[12px] border border-brand/25 bg-brand/10 px-4 py-3 text-[12px] font-semibold leading-5 text-soft">
                  {status}
                </p>
              ) : null}

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={resendBusy || resendSeconds > 0}
                  className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-[14px] bg-brand px-4 text-sm font-extrabold text-white transition enabled:hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-muted"
                >
                  {resendBusy ? (
                    <Loader2
                      aria-hidden="true"
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <RefreshCw aria-hidden="true" size={17} />
                  )}
                  {resendSeconds > 0 ? `Resend in ${resendSeconds}s` : "Resend"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmationEmail(null);
                    setStatus(null);
                    setMode("signup");
                  }}
                  className="h-12 flex-1 rounded-[14px] border border-white/15 px-4 text-sm font-extrabold text-white transition hover:border-brand/60"
                >
                  Change email
                </button>
              </div>

              <button
                type="button"
                onClick={() => switchMode("signin")}
                className="mt-6 text-sm font-extrabold text-brand-light underline decoration-brand-light/40 underline-offset-4 transition hover:text-brand"
              >
                I confirmed it. Log in
              </button>
            </div>
          ) : (
            <div>
              <h1 className="font-display text-[40px] font-black leading-none text-white">
                {mode === "signup" ? "Start coaching here." : "Welcome back."}
              </h1>
              <p className="mt-3 text-sm font-semibold leading-6 text-muted">
                {mode === "signup"
                  ? "Create a free trainer account. Your profile takes about 5 minutes."
                  : "Log in to manage your profile, leads, and analytics."}
              </p>

              <div className="mt-7 grid grid-cols-2 rounded-[14px] border border-white/10 bg-panel p-1">
                {(["signin", "signup"] as AuthMode[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => switchMode(item)}
                    className={`h-10 rounded-[10px] text-sm font-extrabold transition ${
                      mode === item
                        ? "bg-brand text-white"
                        : "text-muted hover:text-white"
                    }`}
                  >
                    {item === "signup" ? "Sign up" : "Log in"}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={busy}
                className="mt-6 flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] border border-white/15 bg-white/[0.03] text-sm font-extrabold text-white transition hover:border-brand/60 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LogIn aria-hidden="true" size={18} />
                Continue with Google
              </button>

              <div className="my-6 flex items-center gap-3">
                <span className="h-px flex-1 bg-white/10" />
                <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted">
                  or email
                </span>
                <span className="h-px flex-1 bg-white/10" />
              </div>

              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleEmailAuth();
                }}
              >
                {mode === "signup" ? (
                  <label className="block">
                    <span className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted">
                      Name
                    </span>
                    <span className="relative mt-2 block">
                      <UserRound
                        aria-hidden="true"
                        size={17}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                      />
                      <input
                        value={trainerName}
                        onChange={(event) => setTrainerName(event.target.value)}
                        className="h-[52px] w-full rounded-[14px] border border-white/10 bg-panel pl-11 pr-4 text-[15px] font-semibold text-white outline-none transition placeholder:text-muted focus:border-brand"
                        placeholder="Your name"
                        autoComplete="name"
                      />
                    </span>
                  </label>
                ) : null}

                <label className="block">
                  <span className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted">
                    Email
                  </span>
                  <span className="relative mt-2 block">
                    <Mail
                      aria-hidden="true"
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="h-[52px] w-full rounded-[14px] border border-white/10 bg-panel pl-11 pr-4 text-[15px] font-semibold text-white outline-none transition placeholder:text-muted focus:border-brand"
                      placeholder="coach@example.com"
                      autoComplete="email"
                    />
                  </span>
                </label>

                <label className="block">
                  <span className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted">
                    Password
                  </span>
                  <span className="relative mt-2 block">
                    <Lock
                      aria-hidden="true"
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                    />
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="h-[52px] w-full rounded-[14px] border border-white/10 bg-panel pl-11 pr-4 text-[15px] font-semibold text-white outline-none transition placeholder:text-muted focus:border-brand"
                      placeholder="Password"
                      autoComplete={
                        mode === "signup" ? "new-password" : "current-password"
                      }
                    />
                  </span>
                </label>

                {status ? (
                  <p className="rounded-[12px] border border-brand/25 bg-brand/10 px-4 py-3 text-[12px] font-semibold leading-5 text-soft">
                    {status}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="flex h-[54px] w-full items-center justify-center gap-2 rounded-[14px] bg-brand px-4 text-sm font-extrabold text-white transition enabled:hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-muted"
                >
                  {busy ? (
                    <Loader2
                      aria-hidden="true"
                      size={18}
                      className="animate-spin"
                    />
                  ) : null}
                  {mode === "signup" ? "Create free account" : "Log in"}
                </button>
              </form>

              <p className="mt-6 text-[12px] font-semibold leading-5 text-muted">
                Looking to hire a coach instead?{" "}
                <Link
                  href="/trainers"
                  className="font-extrabold text-brand-light transition hover:text-brand"
                >
                  Browse trainers
                </Link>
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Visual column */}
      <aside className="relative hidden overflow-hidden lg:block">
        <Image
          src={panelImage}
          alt=""
          fill
          priority
          className="object-cover"
          sizes="520px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/20" />
        <div className="absolute inset-x-0 bottom-0 p-10">
          <div className="rounded-[20px] border border-white/15 bg-black/55 p-5 backdrop-blur-xl">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  aria-hidden="true"
                  size={14}
                  className="fill-brand text-brand"
                />
              ))}
            </div>
            <p className="mt-3 text-[14px] font-medium leading-6 text-white">
              Build a profile that sells your coaching: client reviews,
              before/after proof, and your own prices — with leads landing
              straight in your WhatsApp.
            </p>
          </div>
          <p className="mt-5 text-center text-[11px] font-extrabold uppercase tracking-[0.2em] text-white/50">
            Zero platform fee · Direct WhatsApp leads
          </p>
        </div>
      </aside>
    </main>
  );
}
