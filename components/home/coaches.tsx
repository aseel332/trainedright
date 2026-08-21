import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TrainerCard } from "@/components/trainer-card";
import type { Trainer } from "@/lib/types";

/**
 * The published coaches, using the same card the city listing uses — a visitor
 * who taps through should land on something they recognise.
 *
 * There is no "top rated" claim here: with a marketplace this size that would
 * be a boast the data cannot back. The order is either the admin's pick or the
 * strongest client proof first, and the copy says so.
 */
export function HomeCoaches({
  headline,
  body,
  trainers,
  totalCount,
  browseHref,
  browseLabel,
}: {
  headline: string;
  body: string;
  trainers: Trainer[];
  totalCount: number;
  browseHref: string;
  browseLabel: string;
}) {
  if (trainers.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-brand-light">
            {totalCount} {totalCount === 1 ? "coach" : "coaches"} listed
          </p>
          <h2 className="mt-2.5 font-display text-[30px] font-black leading-[1.02] tracking-[-0.01em] md:text-[42px]">
            {headline}
          </h2>
          <p className="mt-3.5 text-[14px] leading-7 text-muted md:text-[15px]">
            {body}
          </p>
        </div>

        <Link
          href={browseHref}
          className="hidden flex-none items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-[13.5px] font-extrabold text-white transition hover:border-brand/45 hover:bg-brand/10 md:inline-flex"
        >
          {browseLabel}
          <ArrowRight aria-hidden="true" size={16} />
        </Link>
      </div>

      <div className="desktop-trainer-grid mt-7 grid gap-0 md:grid-cols-2 md:gap-4">
        {trainers.map((trainer) => (
          <TrainerCard key={trainer.id} trainer={trainer} showPrice />
        ))}
      </div>

      <Link
        href={browseHref}
        className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[14px] border border-white/12 bg-white/[0.04] px-4 text-[15px] font-extrabold text-white md:hidden"
      >
        {browseLabel}
        <ArrowRight aria-hidden="true" size={16} />
      </Link>
    </section>
  );
}
