"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Phone } from "lucide-react";
import { saveTrainerPhone } from "@/app/trainer/verify-phone/actions";

const DIAL_CODE = "+91";

/** India mobile numbers: 10 digits starting 6–9. */
function isValidNationalNumber(value: string) {
  return /^[6-9]\d{9}$/.test(value);
}

function toE164(nationalNumber: string) {
  return `${DIAL_CODE}${nationalNumber}`;
}

function formatSaveError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("too many") || normalized.includes("rate")) {
    return "Too many attempts. Please wait a minute and try again.";
  }

  if (normalized.includes("already been registered") || normalized.includes("already registered")) {
    return "That number is already linked to another account.";
  }

  if (normalized.includes("not configured")) {
    return "Phone number saving is unavailable right now. Please try again later.";
  }

  return message;
}

export function TrainerPhoneVerifyClient() {
  const router = useRouter();
  const [nationalNumber, setNationalNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (busy) {
      return;
    }

    if (!isValidNationalNumber(nationalNumber)) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }

    setBusy(true);
    setError(null);

    const targetE164 = toE164(nationalNumber);
    const result = await saveTrainerPhone(targetE164);

    if (!result.ok) {
      setError(formatSaveError(result.error));
      setBusy(false);
      return;
    }

    router.replace("/trainer/onboarding");
    router.refresh();
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
            <Phone aria-hidden="true" size={26} />
          </span>

          <h1 className="mt-6 font-display text-[36px] font-black leading-none text-white sm:text-[40px]">
            Add your phone number.
          </h1>
          <p className="mt-4 text-sm font-semibold leading-6 text-soft">
            Enter your mobile number to continue setting up your coach profile.
          </p>

          <form
            className="mt-7 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSave();
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
              Continue
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
