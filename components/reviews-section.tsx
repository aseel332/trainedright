"use client";

import { useMemo, useState } from "react";
import { Check, Star } from "lucide-react";
import type { TrainerReview } from "@/lib/types";

type ReviewSort = "recent" | "oldest";

function reviewStarBucket(rating: number) {
  return Math.min(5, Math.max(1, Math.round(rating)));
}

function buildStarBreakdown(reviews: TrainerReview[]) {
  const total = reviews.length;

  return [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter(
      (review) => reviewStarBucket(review.rating) === star,
    ).length;

    return {
      star,
      count,
      percent: total > 0 ? (count / total) * 100 : 0,
    };
  });
}

function ReviewCard({ review }: { review: TrainerReview }) {
  return (
    <article className="rounded-[16px] border border-white/10 bg-panel p-4">
      <div className="mb-3 flex items-start gap-3">
        <span
          className="grid h-10 w-10 flex-none place-items-center rounded-full font-display text-xs font-extrabold text-white"
          style={{ backgroundColor: review.avatarColor }}
        >
          {review.clientInitials}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-extrabold text-white">
              {review.clientName}
            </h3>
            {review.isVerified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-1 text-[9px] font-extrabold uppercase text-emerald-300">
                <Check aria-hidden="true" size={10} />
                Verified
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-[11px] font-medium text-muted">
            {review.whenLabel}
          </p>
        </div>
        <span className="inline-flex flex-none items-center gap-1 rounded-full border border-white/10 bg-black/35 px-2.5 py-1.5 text-[12px] font-extrabold text-white">
          <Star aria-hidden="true" size={13} className="fill-brand text-brand" />
          {review.rating.toFixed(1)}
        </span>
      </div>
      <p className="text-[13px] leading-6 text-soft">{review.reviewText}</p>
    </article>
  );
}

export function ReviewsSection({
  rating,
  reviewCount,
  reviews,
}: {
  rating: number;
  reviewCount: number;
  reviews: TrainerReview[];
}) {
  const [sort, setSort] = useState<ReviewSort>("recent");
  const [visibleCount, setVisibleCount] = useState(5);
  const breakdown = useMemo(() => buildStarBreakdown(reviews), [reviews]);
  const sortedReviews = useMemo(
    () =>
      [...reviews].sort((first, second) =>
        sort === "recent"
          ? first.sortOrder - second.sortOrder
          : second.sortOrder - first.sortOrder,
      ),
    [reviews, sort],
  );
  const visibleReviews = sortedReviews.slice(0, visibleCount);
  const hasMoreReviews = visibleCount < sortedReviews.length;

  return (
    <div>
      <div className="rounded-[20px] border border-white/10 bg-panel p-4 md:p-5">
        <div className="grid gap-5 md:grid-cols-[170px_minmax(0,1fr)] md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Star
                aria-hidden="true"
                size={24}
                className="fill-brand text-brand"
              />
              <span className="font-display text-[42px] font-black leading-none text-white">
                {rating.toFixed(1)}
              </span>
            </div>
            <p className="mt-2 text-[11px] font-extrabold uppercase tracking-[0.1em] text-muted">
              {reviewCount} reviews
            </p>
          </div>

          <div className="space-y-2.5">
            {breakdown.map((item) => (
              <div key={item.star} className="grid grid-cols-[40px_1fr_28px] items-center gap-3">
                <span className="inline-flex items-center gap-1 text-[12px] font-extrabold text-soft">
                  {item.star}
                  <Star
                    aria-hidden="true"
                    size={11}
                    className="fill-brand text-brand"
                  />
                </span>
                <span className="h-2 overflow-hidden rounded-full bg-white/10">
                  <span
                    className="block h-full rounded-full bg-brand"
                    style={{ width: `${item.percent}%` }}
                  />
                </span>
                <span className="text-right text-[11px] font-bold text-muted">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-[12px] font-bold text-muted">
          Showing {visibleReviews.length} of {sortedReviews.length}
        </p>
        <div className="inline-flex rounded-full border border-white/10 bg-panel p-1">
          {(["recent", "oldest"] as ReviewSort[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setSort(option);
                setVisibleCount(5);
              }}
              className={`rounded-full px-3 py-1.5 text-[11px] font-extrabold uppercase transition ${
                sort === option
                  ? "bg-brand text-white"
                  : "text-muted hover:text-white"
              }`}
            >
              {option === "recent" ? "Most recent" : "Oldest"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {visibleReviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {hasMoreReviews ? (
        <button
          type="button"
          onClick={() => setVisibleCount((current) => current + 5)}
          className="mt-4 text-[12px] font-extrabold uppercase tracking-[0.08em] text-brand-light underline decoration-brand-light/40 underline-offset-4 hover:text-brand"
        >
          Show more reviews
        </button>
      ) : null}
    </div>
  );
}
