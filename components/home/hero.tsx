import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, IndianRupee, ShieldCheck, Star, Users } from "lucide-react";
import {
  HomeHeroSearch,
  type SearchCityOption,
  type SearchGoalOption,
} from "@/components/home-hero-search";
import { fillCity, type HeroHeight, type HomeSettings } from "@/lib/home-settings";
import { isOptimizableImageUrl } from "@/lib/media-links";
import { primaryCategoryLabel } from "@/lib/seo-pages";
import { formatPriceInr } from "@/lib/trainer-utils";
import type { HomeNumbers, HomeReview } from "@/lib/server/home-content";
import type { Trainer } from "@/lib/types";

/** A live category the visitor can jump straight into. */
export type HeroGoalLink = {
  id: string;
  label: string;
  count: number;
  href: string;
};

const HEIGHT_CLASS: Record<HeroHeight, string> = {
  natural: "",
  tall: "hero-h-tall",
  full: "hero-h-full",
};

/**
 * The hero's background: two colour blooms in opposite corners.
 *
 * Brand tints go down first and always — coach photos here are mostly dark gym
 * interiors, so on their own they bloom to a muddy grey. The tint guarantees
 * warmth, and the page still looks finished before anyone is published.
 *
 * On top of those, in ambient mode, the same corners carry a real coach photo
 * blurred far past the point of being a photo. At this radius a face is only a
 * shape of light, so the page takes its colour from the actual roster without
 * ever putting someone's portrait behind the type — and it re-tints itself as
 * the roster changes.
 *
 * `sizes` is deliberately tiny: the browser only needs a thumbnail to blur, so
 * this costs a few kilobytes rather than a full hero image.
 */
function HeroAmbience({ photos }: { photos: string[] }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div className="hero-bloom hero-bloom--one hero-bloom--brand" />
      <div className="hero-bloom hero-bloom--two hero-bloom--cool" />

      {photos.slice(0, 2).map((url, index) => (
        <div
          key={`${url}-${index}`}
          className={`hero-bloom hero-bloom--photo ${
            index === 0 ? "hero-bloom--one" : "hero-bloom--two"
          }`}
        >
          <Image
            src={url}
            alt=""
            fill
            unoptimized={!isOptimizableImageUrl(url)}
            className="object-cover"
            sizes="320px"
          />
        </div>
      ))}
    </div>
  );
}

/**
 * The coach panel beside the copy: real published coaches, their own photos,
 * ratings and prices. Desktop only — on a phone the coaches section starts one
 * scroll below, and naming the same three people twice reads as padding.
 */
function HeroCoachPanel({
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
    <div className="rounded-[22px] border border-white/10 bg-[#141417]/85 p-3 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.95)] backdrop-blur-xl">
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
 * Live category shortcuts. They fill the copy column's lower half — which is
 * what stops it looking stranded next to the taller coach panel — and they earn
 * the space, since each one skips the visitor straight past the search.
 */
function HeroGoalChips({ goals }: { goals: HeroGoalLink[] }) {
  if (goals.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Browse by coach type" className="mt-5">
      <ul className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {goals.map((goal) => (
          <li key={goal.id} className="flex-none">
            <Link
              href={goal.href}
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-4 text-[13px] font-extrabold text-white transition hover:border-brand/45 hover:bg-brand/10"
            >
              {goal.label}
              <span className="text-[11.5px] font-bold text-muted">
                {goal.count}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Live facts, as one compact wrapped line rather than a stacked list. */
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
    <dl className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
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
  goalLinks,
  defaultCity,
}: {
  settings: HomeSettings;
  numbers: HomeNumbers;
  trainers: Trainer[];
  review: HomeReview | null;
  cities: SearchCityOption[];
  goals: SearchGoalOption[];
  goalLinks: HeroGoalLink[];
  defaultCity: string;
}) {
  const hero = settings.hero;
  const title = fillCity(hero.title, numbers.primaryCity);
  const subtitle = fillCity(hero.subtitle, numbers.primaryCity);
  const panelTrainers = hero.showCoachPanel ? trainers.slice(0, 3) : [];

  // The admin can pin which coach tints the page; otherwise it follows whoever
  // currently leads. A second, different coach gives the two blooms distinct
  // colour instead of one flat wash.
  const pinned = trainers.find((trainer) => trainer.slug === hero.ambientSlug);
  const ordered = pinned
    ? [pinned, ...trainers.filter((trainer) => trainer.slug !== pinned.slug)]
    : trainers;
  const ambientSources = ordered
    .slice(0, 2)
    .map((trainer) => trainer.cardImageUrl)
    .filter(Boolean);

  return (
    <section
      className={`hero-surface hero-grain relative isolate flex flex-col justify-center overflow-hidden border-b border-white/8 ${
        HEIGHT_CLASS[hero.height]
      }`}
    >
      {hero.background !== "plain" ? (
        <HeroAmbience
          photos={hero.background === "ambient" ? ambientSources : []}
        />
      ) : null}

      {/* Above the grain: at 5% it would otherwise lay a texture over the type
          itself and cost the headline a little crispness. */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        {/* Top-aligned on purpose: centring a short copy column against the
            taller coach panel is what made the headline float low and read as
            bottom-aligned. */}
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)] lg:items-start lg:gap-14">
          <div className="min-w-0">
            <h1 className="font-display text-[34px] font-black leading-[1.06] tracking-[-0.02em] sm:text-[46px] sm:leading-[1.02] lg:text-[60px]">
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

            {hero.showGoalChips ? <HeroGoalChips goals={goalLinks} /> : null}

            <HeroStats numbers={numbers} />
          </div>

          {panelTrainers.length > 0 ? (
            <div className="hidden min-w-0 lg:block">
              <HeroCoachPanel
                trainers={panelTrainers}
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
