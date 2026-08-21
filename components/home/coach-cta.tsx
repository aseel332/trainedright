import { BarChart3, BadgeCheck, ImagePlus, Wallet } from "lucide-react";
import { CoachCtaActions } from "@/components/home/coach-cta-actions";
import type { HomeSettings } from "@/lib/home-settings";

/** Each one is a feature that already exists in the trainer dashboard. */
const INCLUDED = [
  { icon: Wallet, title: "0% commission" },
  { icon: BadgeCheck, title: "Verified reviews" },
  { icon: ImagePlus, title: "Transformations" },
  { icon: BarChart3, title: "Demand analytics" },
];

export function HomeCoachCta({ settings }: { settings: HomeSettings }) {
  return (
    <section className="border-t border-white/8">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {/* A hairline brand edge and one soft corner light — no full-panel
            gradient wash behind the type. */}
        <div className="relative overflow-hidden rounded-[24px] border border-brand/25 bg-panel">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-brand/12 blur-[90px]"
          />

          <div className="relative grid gap-7 p-6 sm:p-9 lg:grid-cols-[minmax(0,1fr)_minmax(0,300px)] lg:items-center lg:gap-12 lg:p-11">
            <div className="min-w-0">
              <h2 className="font-display text-[28px] font-black leading-[1.05] tracking-[-0.015em] md:text-[38px]">
                {settings.trainerCta.headline}
              </h2>
              {settings.trainerCta.body ? (
                <p className="mt-3 max-w-lg text-[14px] leading-6 text-soft">
                  {settings.trainerCta.body}
                </p>
              ) : null}

              <CoachCtaActions primaryLabel={settings.trainerCta.primaryLabel} />
            </div>

            {/* Four labels, no explanatory sentences — each one is already a
                complete thought, and the /trainer page explains them. */}
            <ul className="grid grid-cols-2 gap-2.5">
              {INCLUDED.map((item) => {
                const Icon = item.icon;
                return (
                  <li
                    key={item.title}
                    className="flex items-center gap-2.5 rounded-[14px] border border-white/8 bg-black/25 px-3.5 py-3"
                  >
                    <Icon
                      aria-hidden="true"
                      size={17}
                      className="flex-none text-brand-light"
                    />
                    <span className="text-[12.5px] font-extrabold leading-tight text-white">
                      {item.title}
                    </span>
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
