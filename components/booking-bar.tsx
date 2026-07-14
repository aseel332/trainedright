"use client";

import { useState } from "react";
import { Check, MessageCircle } from "lucide-react";
import { formatPriceInr } from "@/lib/trainer-utils";

export function BookingBar({ priceFromInr }: { priceFromInr: number }) {
  const [requested, setRequested] = useState(false);

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/90 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl lg:hidden">
        <BookingContent
          priceFromInr={priceFromInr}
          requested={requested}
          onRequest={() => setRequested(true)}
        />
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-24 rounded-[18px] border border-white/10 bg-panel p-4">
          <p className="text-[11px] font-semibold text-muted">From</p>
          <p className="mt-1 font-display text-[30px] font-black text-white">
            {formatPriceInr(priceFromInr)}
            <span className="ml-1 font-sans text-xs font-semibold text-muted">
              /session
            </span>
          </p>
          <p className="mt-2 text-sm leading-6 text-muted">
            Free first session. No card needed.
          </p>
          <div className="mt-5">
            <BookingContent
              priceFromInr={priceFromInr}
              requested={requested}
              onRequest={() => setRequested(true)}
              compact
            />
          </div>
        </div>
      </aside>
    </>
  );
}

function BookingContent({
  priceFromInr,
  requested,
  onRequest,
  compact = false,
}: {
  priceFromInr: number;
  requested: boolean;
  onRequest: () => void;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 ${
        compact ? "flex-col items-stretch" : ""
      }`}
    >
      {!compact ? (
        <div className="flex-none">
          <p className="text-[10px] font-semibold text-muted">From</p>
          <p className="font-display text-[19px] font-black text-white">
            {formatPriceInr(priceFromInr)}
            <span className="font-sans text-[11px] font-semibold text-muted">
              /session
            </span>
          </p>
        </div>
      ) : null}
      <button
        type="button"
        aria-label="Message coach"
        className={`grid place-items-center rounded-[14px] border border-white/10 bg-[#161619] text-white ${
          compact ? "h-12 w-full" : "h-12 w-12 flex-none"
        }`}
      >
        <MessageCircle aria-hidden="true" size={21} />
      </button>
      <button
        type="button"
        onClick={onRequest}
        className="flex min-h-12 flex-1 flex-col items-center justify-center rounded-[14px] bg-brand px-4 py-2 text-white transition hover:bg-brand-dark"
      >
        <span className="inline-flex items-center gap-2 text-sm font-extrabold">
          {requested ? (
            <>
              Trial requested <Check aria-hidden="true" size={16} />
            </>
          ) : (
            "Book a trial"
          )}
        </span>
        <span className="text-[10px] font-semibold text-white/80">
          Free first session
        </span>
      </button>
    </div>
  );
}
