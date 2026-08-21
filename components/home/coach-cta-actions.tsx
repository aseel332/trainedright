"use client";

import Link from "next/link";
import { ArrowRight, LayoutDashboard } from "lucide-react";
import { useTrainerSession } from "@/lib/client/use-trainer-session";

const PRIMARY =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-[14px] bg-brand px-6 text-[15px] font-extrabold text-white transition hover:bg-brand-dark";
const SECONDARY =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-[14px] border border-white/15 bg-white/[0.03] px-6 text-[15px] font-extrabold text-white transition hover:border-brand/50 hover:bg-brand/10";

/**
 * The coach CTA, aware of who is reading it.
 *
 * A signed-in trainer being told to "create your profile" is the clearest way
 * to make someone doubt they are logged in, so they get their dashboard
 * instead. The button slot keeps its height while the session resolves.
 */
export function CoachCtaActions({ primaryLabel }: { primaryLabel: string }) {
  const session = useTrainerSession();

  if (session.status === "loading") {
    return (
      <div className="mt-7 flex flex-wrap gap-3">
        <span
          aria-hidden="true"
          className="h-12 w-[210px] animate-pulse rounded-[14px] bg-white/[0.07]"
        />
        <span
          aria-hidden="true"
          className="h-12 w-[150px] animate-pulse rounded-[14px] bg-white/[0.04]"
        />
      </div>
    );
  }

  if (session.status === "signed-in") {
    return (
      <div className="mt-7 flex flex-wrap gap-3">
        <Link href="/trainer/dashboard" className={PRIMARY}>
          <LayoutDashboard aria-hidden="true" size={17} />
          Go to your dashboard
        </Link>
        {session.publicSlug ? (
          <Link href={`/trainers/${session.publicSlug}`} className={SECONDARY}>
            View your public profile
          </Link>
        ) : (
          <Link href="/trainer" className={SECONDARY}>
            How listing works
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="mt-7 flex flex-wrap gap-3">
      <Link
        href="/trainer/auth?mode=signup&next=/trainer/onboarding"
        className={PRIMARY}
      >
        {primaryLabel}
        <ArrowRight aria-hidden="true" size={17} />
      </Link>
      <Link href="/trainer" className={SECONDARY}>
        See how it works
      </Link>
    </div>
  );
}
