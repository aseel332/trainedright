import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, IndianRupee, ShieldCheck, Star, Users } from "lucide-react";
import {
  HomeHeroSearch,
  type SearchCityOption,
  type SearchGoalOption,
} from "@/components/home-hero-search";
import { isOptimizableImageUrl } from "@/lib/media-links";
import { primaryCategoryLabel } from "@/lib/seo-pages";
import { formatPriceInr } from "@/lib/trainer-utils";
import type { HomeNumbers, HomeReview } from "@/lib/server/home-content";
import type { HomeSettings } from "@/lib/home-settings";
import type { Trainer } from "@/lib/types";

/** A verified client quote, on its own. Used as the mobile hero proof. */
function HeroReviewQuote({ review }: { review: HomeReview }) {
  return (
    <figure className="rounded-[16px] border border-white/10 bg-panel/60 p-4">
      <blockquote className="line-clamp-3 text-[13px] leading-6 text-soft">
        &ldquo;{review.reviewText}&rdquo;
      </blockquote>
      <figcaption className="mt-2.5 flex items-center gap-2 text-[11.5px] font-bold text-muted">
        {review.isVerified ? (
          <BadgeCheck
            aria-hidden="true"
            size={13}
            className="flex-none text-emerald-300"
          />
        ) : null}
        <span className="truncate">
          {review.clientName} on {review.trainerName}
        </span>
      </figcaption>
    </figure>
  );
}

/**
 * The coach stack beside the headline.
 *
 * This is the hero image: real published coaches, their own photos, their own
 * ratings and prices. A stock gym photo would say nothing about whether anyone
 * is actually on the platform — this says exactly who is.
 *
 * Desktop only. On a phone the coaches section starts one scroll below, and
 * naming the same three people twice in a row reads as padding — so the mobile
 * hero keeps the client quote and drops the roster.
 */
function HeroCoachStack({
  trainers,
  review,
  totalCount,
}: {
  trainers: Trainer[];
  review: HomeReview | null;
  totalCount: number;
}) {
  const remaining = Math.max(0, totalCount - trainers.length);

  return (
    <div className="rounded-[22px] border border-white/10 bg-panel/70 p-3 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.95)] backdrop-blur-xl">
      <p className="flex items-center gap-2 px-2 pb-3 pt-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-muted">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        On the site right now
      </p>

      <ul className="space-y-2">
        {trainers.map((trainer) => (
          <li key={trainer.id}>
            <Link
              href={`/trainers/${trainer.slug}`}
              className="group flex items-center gap-3 rounded-[16px] border border-white/8 bg-black/30 p-2.5 transition hover:border-brand/45 hover:bg-black/50"
            >
              <span className="relative h-14 w-14 flex-none overflow-hidden rounded-[12px] bg-[#221215]">
                <Image
                  src={trainer.cardImageUrl}
                  alt={`${trainer.name}, coach in ${trainer.city}`}
                  fill
                  unoptimized={!isOptimizableImageUrl(trainer.cardImageUrl)}
                  className="object-cover transition duration-300 group-hover:scale-105"
                  sizes="56px"
                />
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate font-display text-[15px] font-extrabold text-white">
                    {trainer.name}
                  </span>
                  {trainer.rating > 0 ? (
                    <span className="inline-flex flex-none items-center gap-1 text-[12px] font-extrabold text-white">
                      <Star
                        aria-hidden="true"
                        size={12}
                        className="fill-brand text-brand"
                      />
                      {trainer.rating.toFixed(1)}
                    </span>
                  ) : null}
                </span>
                <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11.5px] font-semibold text-muted">
                  <span className="truncate">
                    {primaryCategoryLabel(trainer.categories)}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{trainer.yearsExperience} yrs</span>
                  {trainer.priceFromInr > 0 ? (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-soft">
                        {formatPriceInr(trainer.priceFromInr)}
                      </span>
                    </>
                  ) : null}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {review ? (
        <figure className="mt-2 rounded-[16px] border border-white/8 bg-black/20 p-3.5">
          <blockquote className="line-clamp-3 text-[12.5px] leading-5 text-soft">
            &ldquo;{review.reviewText}&rdquo;
          </blockquote>
          <figcaption className="mt-2.5 flex items-center gap-2 text-[11px] font-bold text-muted">
            {review.isVerified ? (
              <BadgeCheck
                aria-hidden="true"
                size={13}
                className="flex-none text-emerald-300"
              />
            ) : null}
            <span className="truncate">
              {review.clientName} on {review.trainerName}
            </span>
          </figcaption>
        </figure>
      ) : null}

      {remaining > 0 ? (
        <p className="px-2 pb-1 pt-3 text-[11.5px] font-bold text-muted">
          + {remaining} more {remaining === 1 ? "coach" : "coaches"} listed
        </p>
      ) : null}
    </div>
  );
}

function HeroStats({ numbers }: { numbers: HomeNumbers }) {
  const stats: { icon: typeof Users; text: string }[] = [];

  if (numbers.coachCount > 0) {
    const noun = numbers.coachCount === 1 ? "coach" : "coaches";
    stats.push({
      icon: Users,
      // Naming the city keeps this a fact rather than a claim about quality.
      text: numbers.primaryCity
        ? `${numbers.coachCount} ${noun} in ${numbers.primaryCity}`
        : `${numbers.coachCount} ${noun} listed`,
    });
  }

  if (numbers.averageRating > 0 && numbers.reviewCount > 0) {
    stats.push({
      icon: Star,
      text: `${numbers.averageRating.toFixed(1)} average from ${
        numbers.reviewCount
      } client ${numbers.reviewCount === 1 ? "review" : "reviews"}`,
    });
  }

  if (numbers.lowestPriceInr > 0) {
    stats.push({
      icon: IndianRupee,
      text: `Sessions from ${formatPriceInr(numbers.lowestPriceInr)}`,
    });
  }

  // Not a metric — a standing promise, and the reason none of the above is
  // pay-to-play. Worth stating next to the numbers it explains.
  stats.push({ icon: ShieldCheck, text: "No booking fee, ever" });

  return (
    <dl className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.text} className="flex items-center gap-2">
            <Icon aria-hidden="true" size={15} className="flex-none text-brand-light" />
            <dt className="sr-only">Marketplace fact</dt>
            <dd className="text-[13px] font-bold text-soft">{stat.text}</dd>
          </div>
        );
      })}
    </dl>
  );
}

export function HomeHero({
  settings,
  numbers,
  trainers,
  review,
  cities,
  goals,
  defaultCity,
}: {
  settings: HomeSettings;
  numbers: HomeNumbers;
  trainers: Trainer[];
  review: HomeReview | null;
  cities: SearchCityOption[];
  goals: SearchGoalOption[];
  defaultCity: string;
}) {
  const stackTrainers = trainers.slice(0, 3);

  return (
    <section className="hero-surface relative overflow-hidden border-b border-white/8">
      <div aria-hidden="true" className="hero-grid absolute inset-0" />

      <div className="relative mx-auto w-full max-w-7xl px-4 pb-12 pt-10 sm:px-6 sm:pb-16 sm:pt-14 lg:px-8 lg:pb-24 lg:pt-20">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,376px)] lg:items-center lg:gap-14">
          <div className="min-w-0">
            {settings.hero.eyebrow ? (
              <p className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-soft">
                <BadgeCheck
                  aria-hidden="true"
                  size={14}
                  className="flex-none text-emerald-300"
                />
                {settings.hero.eyebrow}
              </p>
            ) : null}

            <h1 className="mt-5 font-display text-[40px] font-black leading-[0.96] tracking-[-0.02em] sm:text-[58px] lg:text-[72px]">
              {settings.hero.titleLead}
              <span className="block text-brand-light">
                {settings.hero.titleAccent}
              </span>
            </h1>

            <p className="mt-5 max-w-[38rem] text-[15px] font-medium leading-7 text-soft md:text-[17px] md:leading-8">
              {settings.hero.subtitle}
            </p>

            <div className="mt-8 max-w-2xl">
              <HomeHeroSearch
                cities={cities}
                goals={goals}
                defaultCity={defaultCity}
              />
            </div>

            <HeroStats numbers={numbers} />

            {review ? (
              <div className="mt-6 max-w-2xl lg:hidden">
                <HeroReviewQuote review={review} />
              </div>
            ) : null}
          </div>

          {stackTrainers.length > 0 ? (
            <div className="hidden min-w-0 lg:block">
              <HeroCoachStack
                trainers={stackTrainers}
                review={review}
                totalCount={numbers.coachCount}
              />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
