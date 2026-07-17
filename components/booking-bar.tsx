"use client";

import { MessageCircle } from "lucide-react";
import { trackTrainerEvent } from "@/lib/client/track";
import { formatPriceInr } from "@/lib/trainer-utils";

function whatsappHref(
  trainerName: string,
  whatsappNumber: string,
  intent: "question" | "trial",
) {
  const phone = whatsappNumber.replace(/\D/g, "");
  const text = encodeURIComponent(
    intent === "trial"
      ? `Hi ${trainerName}, I found your profile on TrainedRight and would like to book a free trial session.`
      : `Hi ${trainerName}, I found your profile on TrainedRight and want to ask about training.`,
  );

  return `https://wa.me/${phone}?text=${text}`;
}

/**
 * The contact rail on a public trainer profile. Both actions open the
 * trainer's WhatsApp — that is the product's contact channel — and each tap
 * is recorded so the trainer sees real demand in their dashboard.
 */
export function BookingBar({
  slug,
  priceFromInr,
  trainerName,
  whatsappNumber,
}: {
  slug: string;
  priceFromInr: number;
  trainerName: string;
  whatsappNumber: string;
}) {
  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/90 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl lg:hidden">
        <BookingContent
          slug={slug}
          priceFromInr={priceFromInr}
          trainerName={trainerName}
          whatsappNumber={whatsappNumber}
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
              slug={slug}
              priceFromInr={priceFromInr}
              trainerName={trainerName}
              whatsappNumber={whatsappNumber}
              compact
            />
          </div>
        </div>
      </aside>
    </>
  );
}

function BookingContent({
  slug,
  priceFromInr,
  trainerName,
  whatsappNumber,
  compact = false,
}: {
  slug: string;
  priceFromInr: number;
  trainerName: string;
  whatsappNumber: string;
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
        href={whatsappHref(trainerName, whatsappNumber, "question")}
        target="_blank"
        rel="noreferrer"
        aria-label="Message coach on WhatsApp"
        onClick={() => trackTrainerEvent(slug, "whatsapp_click")}
        className={`grid place-items-center rounded-[14px] border border-emerald-400/25 bg-emerald-400/10 text-emerald-300 transition hover:bg-emerald-400 hover:text-black ${
          compact ? "h-12 w-full" : "h-12 w-12 flex-none"
        }`}
      >
        <MessageCircle aria-hidden="true" size={21} />
      </a>
      <a
        href={whatsappHref(trainerName, whatsappNumber, "trial")}
        target="_blank"
        rel="noreferrer"
        onClick={() => trackTrainerEvent(slug, "trial_request")}
        className="flex min-h-12 flex-1 flex-col items-center justify-center rounded-[14px] bg-brand px-4 py-2 text-white transition hover:bg-brand-dark"
      >
        <span className="inline-flex items-center gap-2 text-sm font-extrabold">
          Book a trial
        </span>
        <span className="text-[10px] font-semibold text-white/80">
          Free first session on WhatsApp
        </span>
      </a>
    </div>
  );
}
