"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Bookmark, Check, Share2 } from "lucide-react";
import {
  isTrainerSaved,
  subscribeSavedTrainers,
  toggleSavedTrainer,
} from "@/lib/client/saved-trainers";
import { trackTrainerEvent } from "@/lib/client/track";

/**
 * The share / save controls on a public trainer profile. Mounting also counts
 * one profile view — this runs only in a real browser, so bot prefetches
 * don't inflate the numbers.
 */
export function ProfileActions({
  slug,
  trainerName,
}: {
  slug: string;
  trainerName: string;
}) {
  const [shared, setShared] = useState(false);
  const saved = useSyncExternalStore(
    subscribeSavedTrainers,
    () => isTrainerSaved(slug),
    () => false,
  );

  useEffect(() => {
    trackTrainerEvent(slug, "profile_view");
  }, [slug]);

  async function handleShare() {
    const url = `${window.location.origin}/trainers/${slug}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${trainerName} | TrainedRight`,
          text: `Check out ${trainerName} on TrainedRight`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        window.setTimeout(() => setShared(false), 2000);
      }
      trackTrainerEvent(slug, "share");
    } catch {
      // Share sheet dismissed or clipboard unavailable — nothing to do.
    }
  }

  function handleSave() {
    if (toggleSavedTrainer(slug)) {
      trackTrainerEvent(slug, "save");
    }
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={handleShare}
        aria-label="Share trainer"
        className="grid h-11 w-11 place-items-center rounded-[12px] border border-white/15 bg-black/45 text-white backdrop-blur transition hover:border-brand/50"
      >
        {shared ? (
          <Check aria-hidden="true" size={19} className="text-emerald-300" />
        ) : (
          <Share2 aria-hidden="true" size={19} />
        )}
      </button>
      <button
        type="button"
        onClick={handleSave}
        aria-label={saved ? "Remove from saved coaches" : "Save trainer"}
        aria-pressed={saved}
        className={`grid h-11 w-11 place-items-center rounded-[12px] border backdrop-blur transition ${
          saved
            ? "border-brand/60 bg-brand/20 text-brand-light"
            : "border-white/15 bg-black/45 text-white hover:border-brand/50"
        }`}
      >
        <Bookmark
          aria-hidden="true"
          size={19}
          className={saved ? "fill-current" : ""}
        />
      </button>
    </div>
  );
}
