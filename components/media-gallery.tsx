"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import { resolveStoredVideo } from "@/lib/media-links";
import type { TrainerMedia } from "@/lib/types";

export function MediaGallery({ media }: { media: TrainerMedia[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = media[activeIndex] ?? media[0];

  if (!active) {
    return null;
  }

  // Autoplay the featured slot where the source allows it (YouTube + direct
  // files). Google Drive's preview player embeds and plays on tap.
  const activeVideo =
    active.type === "video" ? resolveStoredVideo(active.url, true) : null;

  return (
    <div className="grid grid-cols-[66px_minmax(0,1fr)] gap-3 md:grid-cols-[82px_minmax(0,1fr)]">
      <div className="flex max-h-[320px] flex-col gap-2 overflow-y-auto scrollbar-none">
        {media.map((item, index) => {
          const isVideo = item.type === "video";
          const thumb = item.posterUrl || (isVideo ? "" : item.url);
          return (
            <button
              type="button"
              key={item.id}
              onClick={() => setActiveIndex(index)}
              aria-label={`View media ${index + 1}`}
              className={`relative h-[62px] w-[62px] flex-none overflow-hidden rounded-[12px] border-2 bg-panel md:h-[76px] md:w-[76px] ${
                activeIndex === index ? "border-brand" : "border-transparent"
              }`}
            >
              {thumb ? (
                <Image
                  src={thumb}
                  alt=""
                  fill
                  unoptimized
                  className={`object-cover ${
                    activeIndex === index ? "opacity-100" : "opacity-60"
                  }`}
                  sizes="76px"
                />
              ) : (
                <span className="grid h-full w-full place-items-center bg-gradient-to-br from-[#241318] to-[#141417]" />
              )}
              {isVideo ? (
                <span className="absolute inset-0 grid place-items-center bg-black/30 text-white">
                  <Play aria-hidden="true" size={18} fill="currentColor" />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="relative h-[260px] overflow-hidden rounded-[18px] border border-white/10 bg-black md:h-[360px]">
        {activeVideo ? (
          <>
            {activeVideo.isIframe ? (
              <iframe
                src={activeVideo.src}
                title="Trainer video"
                className="h-full w-full"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                src={activeVideo.src}
                poster={active.posterUrl ?? undefined}
                className="h-full w-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                controls
              />
            )}
            <span className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-[10px] font-extrabold uppercase text-white backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-brand" />
              Video
            </span>
          </>
        ) : (
          <Image
            src={active.url}
            alt=""
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 640px, calc(100vw - 120px)"
          />
        )}
      </div>
    </div>
  );
}
