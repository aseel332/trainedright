import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, BadgeCheck, Clock, Star } from "lucide-react";
import { isOptimizableImageUrl } from "@/lib/media-links";
import type {
  HomeReview,
  HomeTransformation,
} from "@/lib/server/home-content";

function Stars({ rating }: { rating: number }) {
  const rounded = Math.round(rating);

  return (
    <span
      className="inline-flex items-center gap-0.5"
      aria-label={`${rating.toFixed(1)} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((step) => (
        <Star
          key={step}
          aria-hidden="true"
          size={13}
          className={
            step <= rounded ? "fill-brand text-brand" : "text-white/20"
          }
        />
      ))}
    </span>
  );
}

/**
 * A client's before/after, side by side.
 *
 * The profile page uses a draggable comparison slider; here the two frames sit
 * next to each other so the whole thing is one static image pair — no JS on the
 * landing page's critical path, and nothing to mis-drag on a phone.
 */
function TransformationProof({ item }: { item: HomeTransformation }) {
  const frames = [
    { label: "Before", url: item.beforeImageUrl, dim: true },
    { label: "After", url: item.afterImageUrl, dim: false },
  ];

  return (
    <article className="overflow-hidden rounded-[22px] border border-white/10 bg-panel">
      <div className="grid grid-cols-2 gap-px bg-white/10">
        {frames.map((frame) => (
          <div
            key={frame.label}
            className="relative aspect-[3/4] bg-black sm:aspect-[4/5]"
          >
            <Image
              src={frame.url}
              alt={`${item.clientName} ${frame.label.toLowerCase()} training with ${item.trainerName}`}
              fill
              unoptimized={!isOptimizableImageUrl(frame.url)}
              className={`object-cover ${frame.dim ? "saturate-[0.7]" : ""}`}
              sizes="(min-width: 1024px) 220px, 45vw"
            />
            <span className="absolute left-2.5 top-2.5 rounded-full bg-black/65 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-white/85 backdrop-blur">
              {frame.label}
            </span>
          </div>
        ))}
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="font-display text-[26px] font-black leading-none text-brand-light">
            {item.resultLabel}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[11px] font-extrabold text-soft">
            <Clock aria-hidden="true" size={12} />
            {item.durationLabel}
          </span>
          {item.rating ? (
            <span className="inline-flex items-center gap-1 text-[12px] font-extrabold text-white">
              <Star aria-hidden="true" size={12} className="fill-brand text-brand" />
              {item.rating.toFixed(1)}
            </span>
          ) : null}
        </div>

        {item.review ? (
          <blockquote className="mt-3 line-clamp-3 text-[13px] leading-6 text-soft">
            &ldquo;{item.review}&rdquo;
          </blockquote>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-3.5">
          <p className="text-[12px] font-bold text-muted">
            <span className="text-white">{item.clientName}</span> trained with{" "}
            <Link
              href={`/trainers/${item.trainerSlug}`}
              className="font-extrabold text-brand-light transition hover:text-brand"
            >
              {item.trainerName}
            </Link>
          </p>
          <Link
            href={`/trainers/${item.trainerSlug}/transformations/${item.id}`}
            className="inline-flex items-center gap-1 text-[12px] font-extrabold text-soft transition hover:text-white"
          >
            Full story
            <ArrowUpRight aria-hidden="true" size={14} />
          </Link>
        </div>
      </div>
    </article>
  );
}

function ReviewProof({ review }: { review: HomeReview }) {
  return (
    <figure className="flex h-full flex-col rounded-[20px] border border-white/10 bg-panel p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <Stars rating={review.rating} />
        {review.isVerified ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.1em] text-emerald-300">
            <BadgeCheck aria-hidden="true" size={12} />
            Verified client
          </span>
        ) : null}
      </div>

      {/* Clamped: four full reviews side by side is a wall of prose, and the
          whole thing is one tap away on the coach's profile. */}
      <blockquote className="mt-3 line-clamp-4 flex-1 text-[13.5px] leading-6 text-soft">
        &ldquo;{review.reviewText}&rdquo;
      </blockquote>

      <figcaption className="mt-4 flex items-center gap-3 border-t border-white/8 pt-3.5">
        <span
          aria-hidden="true"
          className="grid h-9 w-9 flex-none place-items-center rounded-full text-[12px] font-black text-white"
          style={{ backgroundColor: review.avatarColor }}
        >
          {review.clientInitials}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-extrabold text-white">
            {review.clientName}
          </span>
          <span className="block truncate text-[11.5px] font-semibold text-muted">
            on{" "}
            <Link
              href={`/trainers/${review.trainerSlug}`}
              className="font-bold text-brand-light transition hover:text-brand"
            >
              {review.trainerName}
            </Link>
            {review.whenLabel ? ` · ${review.whenLabel}` : ""}
          </span>
        </span>
      </figcaption>
    </figure>
  );
}

/**
 * The trust section: what real clients submitted, never what the coach wrote
 * about themselves. Renders whichever proof exists — a marketplace this young
 * may have reviews before it has before/afters, and the layout has to hold
 * either way.
 */
export function HomeProof({
  headline,
  body,
  transformation,
  reviews,
}: {
  headline: string;
  body: string;
  transformation: HomeTransformation | null;
  reviews: HomeReview[];
}) {
  if (!transformation && reviews.length === 0) {
    return null;
  }

  return (
    <section className="border-t border-white/8 bg-panel/25">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="max-w-2xl">
          <h2 className="font-display text-[28px] font-black leading-[1.05] tracking-[-0.015em] md:text-[36px]">
            {headline}
          </h2>
          {body ? (
            <p className="mt-2 text-[13.5px] leading-6 text-muted md:text-[14px]">
              {body}
            </p>
          ) : null}
        </div>

        <div
          className={`mt-6 grid gap-4 ${
            transformation
              ? "lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)]"
              : "lg:grid-cols-1"
          }`}
        >
          {transformation ? (
            <TransformationProof item={transformation} />
          ) : null}

          {reviews.length > 0 ? (
            <div
              className={`grid content-start gap-4 sm:grid-cols-2 ${
                transformation ? "" : "lg:grid-cols-3"
              }`}
            >
              {reviews.map((review) => (
                <ReviewProof key={review.id} review={review} />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
