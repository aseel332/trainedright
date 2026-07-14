"use client";

import { useState } from "react";
import { Check, MessageCircle } from "lucide-react";
import { formatPriceInr } from "@/lib/trainer-utils";

function whatsappHref(trainerName: string, whatsappNumber: string) {
  const phone = whatsappNumber.replace(/\D/g, "");
  const text = encodeURIComponent(
    `Hi ${trainerName}, I found your profile on TrainedRight and want to ask about training.`,
  );

  return `https://wa.me/${phone}?text=${text}`;
}

export function BookingBar({
  priceFromInr,
  trainerName,
  whatsappNumber,
}: {
  priceFromInr: number;
  trainerName: string;
  whatsappNumber: string;
}) {
  const [requested, setRequested] = useState(false);
  const contactHref = whatsappHref(trainerName, whatsappNumber);

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/90 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl lg:hidden">
        <BookingContent
          priceFromInr={priceFromInr}
          contactHref={contactHref}
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
              contactHref={contactHref}
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
  contactHref,
  requested,
  onRequest,
  compact = false,
}: {
  priceFromInr: number;
  contactHref: string;
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
      <a
        href={contactHref}
        target="_blank"
        rel="noreferrer"
        aria-label="Message coach"
        className={`grid place-items-center rounded-[14px] border border-emerald-400/25 bg-emerald-400/10 text-emerald-300 transition hover:bg-emerald-400 hover:text-black ${
          compact ? "h-12 w-full" : "h-12 w-12 flex-none"
        }`}
      >
        <MessageCircle aria-hidden="true" size={21} />
      </a>
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
