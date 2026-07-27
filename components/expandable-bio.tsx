"use client";

import { useState } from "react";

const COLLAPSE_THRESHOLD = 220;

export function ExpandableBio({ bio }: { bio: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong =
    bio.length > COLLAPSE_THRESHOLD || bio.split("\n").length > 4;

  return (
    <div>
      <p
        className={`max-w-4xl whitespace-pre-line text-[15px] leading-7 text-soft md:text-base md:leading-8 ${
          isLong && !expanded ? "line-clamp-5 md:line-clamp-4" : ""
        }`}
      >
        {bio}
      </p>
      {isLong ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-1 text-[13px] font-semibold text-white/70 underline-offset-2 hover:text-white hover:underline md:text-sm"
        >
          {expanded ? "See Less" : "See More"}
        </button>
      ) : null}
    </div>
  );
}
