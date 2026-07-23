"use client";

import { useState } from "react";
import Link from "next/link";
import { BadgeCheck, Check, Link2, Loader2 } from "lucide-react";
import { submitReviewByToken } from "@/app/trainer/actions";
import { StarPicker } from "@/components/trainer-dashboard-client";

export function ReviewSubmitClient({
  token,
  clientName,
  trainerName,
}: {
  token: string;
  clientName: string | null;
  trainerName: string | null;
}) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const invalid = clientName === null;

  async function submit() {
    setBusy(true);
    setError(null);
    const result = await submitReviewByToken({
      token,
      rating,
      reviewText: text,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? "Something went wrong. Please try again.");
      return;
    }
    setDone(true);
  }

  return (
    <main className="flex min-h-screen flex-col bg-background text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex w-full max-w-xl items-center justify-between px-5 py-4">
          <Link
            href="/"
            className="font-display text-[18px] font-black leading-none"
          >
            TRAINED<span className="text-brand">RIGHT</span>
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1.5 text-[10px] font-extrabold uppercase text-emerald-300">
            <BadgeCheck aria-hidden="true" size={12} />
            Verified review
          </span>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-5 py-12">
        {invalid ? (
          <div className="text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-[18px] bg-white/[0.06] text-muted">
              <Link2 aria-hidden="true" size={24} />
            </span>
            <h1 className="mt-6 font-display text-[34px] font-black leading-none">
              This link isn&apos;t active.
            </h1>
            <p className="mx-auto mt-4 max-w-sm text-sm font-semibold leading-6 text-muted">
              It may have been used already or removed by the coach. If you
              still want to leave a review, ask your coach for a fresh link.
            </p>
          </div>
        ) : done ? (
          <div className="text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-400 text-black">
              <Check aria-hidden="true" size={26} />
            </span>
            <h1 className="mt-6 font-display text-[34px] font-black leading-none">
              Thank you, {clientName}.
            </h1>
            <p className="mx-auto mt-4 max-w-sm text-sm font-semibold leading-6 text-muted">
              Your verified review has been recorded and will appear on{" "}
              {trainerName}&apos;s profile.
            </p>
            <Link
              href="/"
              className="mt-8 inline-flex items-center gap-2 rounded-[14px] border border-white/15 px-5 py-3 text-sm font-extrabold text-white transition hover:border-brand/50"
            >
              Browse coaches on TrainedRight
            </Link>
          </div>
        ) : (
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-brand-light">
              Hi {clientName}
            </p>
            <h1 className="mt-3 font-display text-[36px] font-black leading-[0.98] sm:text-[44px]">
              How was training with {trainerName}?
            </h1>
            <p className="mt-4 text-sm font-semibold leading-6 text-muted">
              Your review is published with a verified badge because it comes
              directly from you. It takes less than a minute.
            </p>

            <div className="mt-8 rounded-[20px] border border-white/10 bg-panel p-5">
              <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted">
                Your rating
              </p>
              <StarPicker rating={rating} onChange={setRating} />

              <p className="mb-3 mt-6 text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted">
                Your experience
              </p>
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                rows={5}
                placeholder="What changed for you? How were the sessions, the plan, the communication?"
                className="w-full resize-none rounded-[14px] border border-white/10 bg-black/30 px-4 py-3 text-sm font-medium leading-6 text-white outline-none transition placeholder:text-muted focus:border-brand"
              />

              {error ? (
                <p className="mt-3 text-[12px] font-bold text-brand-light">
                  {error}
                </p>
              ) : null}

              <button
                type="button"
                onClick={submit}
                disabled={busy || !rating || !text.trim()}
                className="mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] bg-brand text-sm font-extrabold text-white transition enabled:hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-muted"
              >
                {busy ? (
                  <Loader2 aria-hidden="true" size={17} className="animate-spin" />
                ) : (
                  <BadgeCheck aria-hidden="true" size={17} />
                )}
                Submit verified review
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
