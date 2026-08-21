import { BarChart3, BadgeCheck, ImagePlus, Wallet } from "lucide-react";
import { CoachCtaActions } from "@/components/home/coach-cta-actions";
import type { HomeSettings } from "@/lib/home-settings";

/** Each line is a feature that already exists in the trainer dashboard. */
const INCLUDED = [
  {
    icon: Wallet,
    title: "0% commission",
    text: "Listing is free and the client pays you directly.",
  },
  {
    icon: BadgeCheck,
    title: "Verified reviews",
    text: "Send a private link; your client writes it, not you.",
  },
  {
    icon: ImagePlus,
    title: "Transformations",
    text: "Clients upload their own before and after photos.",
  },
  {
    icon: BarChart3,
    title: "Demand analytics",
    text: "Views, WhatsApp taps and saves, week by week.",
  },
];

export function HomeCoachCta({ settings }: { settings: HomeSettings }) {
  return (
    <section className="border-t border-white/8">
      <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        {/* A hairline brand edge and one soft corner light — no full-panel
            gradient wash behind the type. */}
        <div className="relative overflow-hidden rounded-[26px] border border-brand/25 bg-panel">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-brand/12 blur-[90px]"
          />

          <div className="relative grid gap-9 p-6 sm:p-9 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:gap-14 lg:p-12">
            <div className="min-w-0">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-brand-light">
                {settings.trainerCta.eyebrow}
              </p>
              <h2 className="mt-3 font-display text-[30px] font-black leading-[1.02] tracking-[-0.01em] md:text-[46px]">
                {settings.trainerCta.headline}
              </h2>
              <p className="mt-4 max-w-xl text-[14px] leading-7 text-soft md:text-[15px]">
                {settings.trainerCta.body}
              </p>

              <CoachCtaActions primaryLabel={settings.trainerCta.primaryLabel} />
            </div>

            <ul className="grid gap-3 sm:grid-cols-2 lg:content-center">
              {INCLUDED.map((item) => {
                const Icon = item.icon;
                return (
                  <li
                    key={item.title}
                    className="rounded-[16px] border border-white/8 bg-black/25 p-4"
                  >
                    <Icon
                      aria-hidden="true"
                      size={19}
                      className="text-brand-light"
                    />
                    <h3 className="mt-3 text-[14px] font-extrabold text-white">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-[12.5px] leading-5 text-muted">
                      {item.text}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
