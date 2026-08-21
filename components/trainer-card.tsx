import Image from "next/image";
import Link from "next/link";
import { BriefcaseBusiness, Star } from "lucide-react";
import { BadgeIcon } from "@/components/badge-icon";
import { formatPriceInr } from "@/lib/trainer-utils";
import type { Trainer } from "@/lib/types";

export function TrainerCard({
  trainer,
  showPrice = false,
}: {
  trainer: Trainer;
  showPrice?: boolean;
}) {
  const primaryBadge = trainer.badges[0];
  const extraBadges = Math.max(0, trainer.badges.length - 1);

  return (
    <Link
      href={`/trainers/${trainer.slug}`}
      className="trainer-card-desktop group grid grid-cols-[108px_minmax(0,1fr)] gap-4 border-b border-white/10 py-4 text-white transition duration-200 hover:border-brand/50 md:grid-cols-[136px_minmax(0,1fr)] md:rounded-[18px] md:border md:border-white/10 md:bg-panel md:p-4 md:hover:bg-panel-strong"
    >
      <div className="trainer-card-image-desktop relative h-[144px] overflow-hidden rounded-[15px] bg-[#221215] md:h-[172px]">
        <Image
          src={trainer.cardImageUrl}
          alt={`${trainer.name} coaching profile`}
          fill
          className="object-cover transition duration-300 group-hover:scale-[1.04]"
          sizes="(min-width: 768px) 136px, 108px"
        />
        {primaryBadge ? (
          <span className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-black/70 backdrop-blur">
            <BadgeIcon badge={primaryBadge} />
            {extraBadges > 0 ? (
              <span className="absolute -bottom-1 -right-1 grid min-h-4 min-w-4 place-items-center rounded-full border border-white/15 bg-black px-1 text-[8px] font-extrabold">
                +{extraBadges}
              </span>
            ) : null}
          </span>
        ) : null}
      </div>

      <div className="min-w-0 pt-0.5">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-[17px] font-extrabold leading-tight [overflow-wrap:anywhere] line-clamp-2 md:text-[20px]">
              {trainer.name}
            </h3>
            <p className="mt-1 text-[11px] font-semibold text-muted md:text-xs">
              {trainer.state ? `${trainer.city}, ${trainer.state}` : trainer.city}
            </p>
          </div>
          {/* A coach with no reviews yet reads as "0.0 ★" if we print the raw
              number — worse than saying nothing. Show that they are new
              instead, which is true and does not look like a bad score. */}
          {trainer.rating > 0 ? (
            <span className="inline-flex flex-none items-center gap-1 text-[12px] font-extrabold md:text-sm">
              <Star
                aria-hidden="true"
                size={14}
                className="fill-brand text-brand"
              />
              {trainer.rating.toFixed(1)}
            </span>
          ) : (
            <span className="inline-flex flex-none items-center rounded-full border border-white/12 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.08em] text-muted">
              New
            </span>
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10.5px] font-semibold text-muted md:text-xs">
          {trainer.reviewCount > 0 ? (
            <>
              <span>
                {trainer.reviewCount}{" "}
                {trainer.reviewCount === 1 ? "review" : "reviews"}
              </span>
              <span className="h-1 w-1 rounded-full bg-white/25" />
            </>
          ) : null}
          <span className="inline-flex items-center gap-1">
            <BriefcaseBusiness aria-hidden="true" size={12} />
            {trainer.yearsExperience} yrs exp
          </span>
          {/* 0 means the coach never set a starting price, not that they work
              for nothing — say nothing rather than "₹0/session". */}
          {showPrice && trainer.priceFromInr > 0 ? (
            <>
              <span className="h-1 w-1 rounded-full bg-white/25" />
              <span>{formatPriceInr(trainer.priceFromInr)}/session</span>
            </>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {trainer.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[10px] font-semibold text-soft md:text-[11px]"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          <span className="mt-1 flex-none font-display text-[30px] font-black leading-[0.6] text-brand/60">
            &quot;
          </span>
          <p className="line-clamp-2 text-[11px] italic leading-5 text-muted md:text-[12px]">
            {trainer.testimonial}
          </p>
        </div>
      </div>
    </Link>
  );
}
