import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, IndianRupee, ShieldCheck, Star, Users } from "lucide-react";
import {
  HomeHeroSearch,
  type SearchCityOption,
  type SearchGoalOption,
} from "@/components/home-hero-search";
import { fillCity, type HomeSettings } from "@/lib/home-settings";
import { isOptimizableImageUrl } from "@/lib/media-links";
import { primaryCategoryLabel } from "@/lib/seo-pages";
import { formatPriceInr } from "@/lib/trainer-utils";
import type { HomeNumbers, HomeReview } from "@/lib/server/home-content";
import type { Trainer } from "@/lib/types";

/**
 * The coach stack beside the headline: real published coaches, their own
 * photos, ratings and prices.
 *
 * Desktop only. On a phone the coaches section starts one scroll below, and
 * naming the same three people twice reads as padding.
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
    <div className="rounded-[22px] border border-white/10 bg-[#141417]/92 p-3 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.95)] backdrop-blur-xl">
      <p className="flex items-center gap-2 px-2 pb-3 pt-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-muted">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        Listed now
      </p>

      <ul className="space-y-2">
        {trainers.map((trainer) => (
          <li key={trainer.id}>
            <Link
              href={`/trainers/${trainer.slug}`}
              className="group flex items-center gap-3 rounded-[16px] border border-white/8 bg-black/35 p-2.5 transition hover:border-brand/45 hover:bg-black/55"
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
        <figure className="mt-2 rounded-[16px] border border-white/8 bg-black/25 p-3.5">
          <blockquote className="line-clamp-2 text-[12.5px] leading-5 text-soft">
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
          + {remaining} more {remaining === 1 ? "coach" : "coaches"}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Live facts, as one compact wrapped line rather than a stacked list — on a
 * phone a list of four sentences is four more lines of text before the search.
 */
function HeroStats({ numbers }: { numbers: HomeNumbers }) {
  const stats: { icon: typeof Users; text: string }[] = [];

  if (numbers.coachCount > 0) {
    stats.push({
      icon: Users,
      text: `${numbers.coachCount} ${
        numbers.coachCount === 1 ? "coach" : "coaches"
      }`,
    });
  }

  if (numbers.averageRating > 0 && numbers.reviewCount > 0) {
    stats.push({
      icon: Star,
      text: `${numbers.averageRating.toFixed(1)} from ${numbers.reviewCount} ${
        numbers.reviewCount === 1 ? "review" : "reviews"
      }`,
    });
  }

  if (numbers.lowestPriceInr > 0) {
    stats.push({
      icon: IndianRupee,
      text: `From ${formatPriceInr(numbers.lowestPriceInr)}`,
    });
  }

  stats.push({ icon: ShieldCheck, text: "No booking fee" });

  return (
    <dl className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 lg:mt-5">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.text} className="flex items-center gap-1.5">
            <Icon
              aria-hidden="true"
              size={14}
              className="flex-none text-brand-light"
            />
            <dt className="sr-only">Marketplace fact</dt>
            <dd className="text-[12.5px] font-bold text-soft">{stat.text}</dd>
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
  const title = fillCity(settings.hero.title, numbers.primaryCity);
  const subtitle = fillCity(settings.hero.subtitle, numbers.primaryCity);

  return (
    // No artwork here by design. With nothing decorative to look at, the hero's
    // job is to get out of the way — the padding is tuned so the first real
    // coach card lands inside the phone viewport rather than a scroll below it.
    <section className="hero-surface relative isolate overflow-hidden border-b border-white/8">
      <div className="relative mx-auto w-full max-w-7xl px-4 pb-9 pt-9 sm:px-6 sm:pb-12 sm:pt-12 lg:px-8 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)] lg:items-center lg:gap-14">
          <div className="min-w-0">
            <h1 className="font-display text-[42px] font-black leading-[1.02] tracking-[-0.025em] sm:text-[58px] lg:text-[68px]">
              {title}
            </h1>

            {subtitle ? (
              <p className="mt-3.5 max-w-lg text-[15px] font-medium leading-6 text-soft md:text-[17px] md:leading-7">
                {subtitle}
              </p>
            ) : null}

            <div className="mt-6 max-w-3xl lg:mt-7">
              <HomeHeroSearch
                cities={cities}
                goals={goals}
                defaultCity={defaultCity}
              />
            </div>

            <HeroStats numbers={numbers} />
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
