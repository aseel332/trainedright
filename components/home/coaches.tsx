import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TrainerCard } from "@/components/trainer-card";
import type { Trainer } from "@/lib/types";

/**
 * The published coaches, using the same card the city listing uses — a visitor
 * who taps through should land on something they recognise.
 *
 * The heading is a label, not a pitch: the cards below carry photos, ratings
 * and prices, and a paragraph of persuasion above them only delays the proof.
 */
export function HomeCoaches({
  headline,
  body,
  trainers,
  browseHref,
  browseLabel,
}: {
  headline: string;
  body: string;
  trainers: Trainer[];
  browseHref: string;
  browseLabel: string;
}) {
  if (trainers.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h2 className="font-display text-[28px] font-black leading-[1.05] tracking-[-0.015em] md:text-[36px]">
            {headline}
          </h2>
          {body ? (
            <p className="mt-2 text-[13.5px] leading-6 text-muted md:text-[14px]">
              {body}
            </p>
          ) : null}
        </div>

        <Link
          href={browseHref}
          className="hidden flex-none items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-5 py-2.5 text-[13px] font-extrabold text-white transition hover:border-brand/45 hover:bg-brand/10 md:inline-flex"
        >
          {browseLabel}
          <ArrowRight aria-hidden="true" size={16} />
        </Link>
      </div>

      <div className="desktop-trainer-grid mt-6 grid gap-0 md:grid-cols-2 md:gap-4">
        {trainers.map((trainer) => (
          <TrainerCard key={trainer.id} trainer={trainer} showPrice />
        ))}
      </div>

      <Link
        href={browseHref}
        className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[14px] border border-white/12 bg-white/[0.04] px-4 text-[15px] font-extrabold text-white md:hidden"
      >
        {browseLabel}
        <ArrowRight aria-hidden="true" size={16} />
      </Link>
    </section>
  );
}
