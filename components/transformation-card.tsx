"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Clock, MoveHorizontal, Star } from "lucide-react";
import type { Transformation } from "@/lib/types";

function reviewPreview(review: string) {
  if (review.length <= 118) {
    return review;
  }

  const trimmed = review.slice(0, 118);
  const lastSpace = trimmed.lastIndexOf(" ");
  return `${trimmed.slice(0, lastSpace > 0 ? lastSpace : trimmed.length)}...`;
}

export function TransformationCard({
  item,
  trainerSlug,
}: {
  item: Transformation;
  trainerSlug: string;
}) {
  const [sliderValue, setSliderValue] = useState(50);
  const detailHref = `/trainers/${encodeURIComponent(
    trainerSlug,
  )}/transformations/${encodeURIComponent(item.id)}`;

  return (
    <article className="w-[86vw] max-w-[430px] flex-none snap-start overflow-hidden rounded-[22px] border border-white/10 bg-panel shadow-2xl shadow-black/30 sm:w-[430px] md:w-full md:max-w-none">
      <div className="relative h-[286px] overflow-hidden bg-black sm:h-[312px] md:h-[318px]">
        <Image
          src={item.afterImageUrl}
          alt=""
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 430px, (min-width: 768px) 50vw, 86vw"
        />
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - sliderValue}% 0 0)` }}
        >
          <Image
            src={item.beforeImageUrl}
            alt=""
            fill
            className="object-cover saturate-75"
            sizes="(min-width: 1024px) 430px, (min-width: 768px) 50vw, 86vw"
          />
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/45 to-transparent p-4 text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/75">
          <span>Before</span>
          <span className="text-emerald-200">After</span>
        </div>

        <div
          className="pointer-events-none absolute inset-y-0 z-10 w-px bg-white"
          style={{ left: `${sliderValue}%` }}
        >
          <span className="absolute left-1/2 top-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/35 bg-black/65 text-white shadow-2xl backdrop-blur">
            <MoveHorizontal aria-hidden="true" size={19} />
          </span>
        </div>

        <input
          aria-label="Move before and after comparison slider"
          type="range"
          min="0"
          max="100"
          value={sliderValue}
          onChange={(event) => setSliderValue(Number(event.target.value))}
          className="absolute inset-0 z-20 h-full w-full cursor-ew-resize opacity-0"
        />
      </div>

      <div className="border-t border-white/10 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="truncate font-display text-[22px] font-black leading-none text-white md:text-[25px]">
              {item.clientName}
            </h3>
            <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.08em] text-brand-light">
              <span>{item.resultLabel}</span>
              <span className="h-1 w-1 rounded-full bg-white/35" />
              <span className="inline-flex items-center gap-1 text-white/70">
                <Clock aria-hidden="true" size={12} />
                {item.durationLabel}
              </span>
            </p>
          </div>
          {item.rating ? (
            <span className="inline-flex flex-none items-center gap-1 rounded-full border border-white/10 bg-black/35 px-2.5 py-1.5 text-[12px] font-extrabold text-white">
              <Star
                aria-hidden="true"
                size={13}
                className="fill-brand text-brand"
              />
              {item.rating.toFixed(1)}
            </span>
          ) : null}
        </div>

        <p className="mt-3 text-[13px] leading-6 text-soft">
          {reviewPreview(item.review)}{" "}
          <Link
            href={detailHref}
            className="font-extrabold text-brand-light hover:text-brand"
          >
            See more
          </Link>
        </p>
      </div>
    </article>
  );
}
