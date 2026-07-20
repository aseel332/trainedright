"use client";

import { MessageCircle, Phone } from "lucide-react";
import { trackTrainerEvent } from "@/lib/client/track";

/** A dialable tel: link from the trainer's stored (country-coded) number. */
function telHref(whatsappNumber: string) {
  return `tel:+${whatsappNumber.replace(/\D/g, "")}`;
}

function whatsappHref(
  trainerName: string,
  whatsappNumber: string,
  intent: "question" | "trial",
  offersFreeTrial = false,
) {
  const phone = whatsappNumber.replace(/\D/g, "");
  const text = encodeURIComponent(
    intent === "trial"
      ? offersFreeTrial
        ? `Hi ${trainerName}, I found your profile on TrainedRight and would like to book a free trial session.`
        : `Hi ${trainerName}, I found your profile on TrainedRight and would like to book a session.`
      : `Hi ${trainerName}, I found your profile on TrainedRight and want to ask about training.`,
  );

  return `https://wa.me/${phone}?text=${text}`;
}

/**
 * The contact rail on a public trainer profile. Message and trial actions open
 * the trainer's WhatsApp — the product's contact channel — the call button
 * dials them, and each WhatsApp tap is recorded so the trainer sees real
 * demand. Pricing lives in the "Pricing" section, linked from here.
 */
export function BookingBar({
  slug,
  trainerName,
  whatsappNumber,
  offersFreeTrial,
  hasPlans,
}: {
  slug: string;
  trainerName: string;
  whatsappNumber: string;
  offersFreeTrial: boolean;
  hasPlans: boolean;
}) {
  const firstName = trainerName.split(/\s+/)[0] || trainerName;

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/90 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl lg:hidden">
        {hasPlans ? (
          <a
            href="#plans"
            className="mb-2 block text-center text-[12px] font-extrabold text-brand-light underline-offset-2 hover:underline"
          >
            See all plans
          </a>
        ) : null}
        <BookingContent
          slug={slug}
          trainerName={trainerName}
          whatsappNumber={whatsappNumber}
          offersFreeTrial={offersFreeTrial}
        />
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-24 rounded-[18px] border border-white/10 bg-panel p-4">
          <p className="font-display text-[22px] font-black text-white">
            Train with {firstName}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted">
            {offersFreeTrial
              ? "Free first session. No card needed."
              : "Message to set up your first session."}
          </p>
          <div className="mt-5">
            <BookingContent
              slug={slug}
              trainerName={trainerName}
              whatsappNumber={whatsappNumber}
              offersFreeTrial={offersFreeTrial}
              compact
            />
          </div>
          {hasPlans ? (
            <a
              href="#plans"
              className="mt-4 block text-center text-[13px] font-extrabold text-brand-light underline-offset-2 hover:underline"
            >
              See all plans
            </a>
          ) : null}
        </div>
      </aside>
    </>
  );
}

function BookingContent({
  slug,
  trainerName,
  whatsappNumber,
  offersFreeTrial,
  compact = false,
}: {
  slug: string;
  trainerName: string;
  whatsappNumber: string;
  offersFreeTrial: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 ${
        compact ? "flex-col items-stretch" : ""
      }`}
    >
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
        href={telHref(whatsappNumber)}
        aria-label={`Call ${trainerName}`}
        className={`grid place-items-center rounded-[14px] border border-sky-400/25 bg-sky-400/10 text-sky-300 transition hover:bg-sky-400 hover:text-black ${
          compact ? "h-12 w-full" : "h-12 w-12 flex-none"
        }`}
      >
        <Phone aria-hidden="true" size={20} />
      </a>
      <a
        href={whatsappHref(trainerName, whatsappNumber, "trial", offersFreeTrial)}
        target="_blank"
        rel="noreferrer"
        onClick={() => trackTrainerEvent(slug, "trial_request")}
        className="flex min-h-12 flex-1 flex-col items-center justify-center rounded-[14px] bg-brand px-4 py-2 text-white transition hover:bg-brand-dark"
      >
        <span className="inline-flex items-center gap-2 text-sm font-extrabold">
          {offersFreeTrial ? "Book a free trial" : "Book a session"}
        </span>
        <span className="text-[10px] font-semibold text-white/80">
          {offersFreeTrial
            ? "Free first session on WhatsApp"
            : "Chat on WhatsApp"}
        </span>
      </a>
    </div>
  );
}
