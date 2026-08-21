import { BadgeCheck, MessageCircle, Search } from "lucide-react";

/**
 * How the product works, in mechanics rather than promises — and in as few
 * words as each step survives on. A visitor can verify all three on the very
 * next page, so the copy does not have to argue for them.
 */
const STEPS = [
  {
    title: "Search your city",
    text: "Filter by coach type, sport, price and experience.",
    icon: Search,
  },
  {
    title: "Check the proof",
    text: "Verified reviews and before/afters come from the client.",
    icon: BadgeCheck,
  },
  {
    title: "Message directly",
    text: "Contact opens WhatsApp. No cut, no booking fee.",
    icon: MessageCircle,
  },
];

export function HomeHowItWorks() {
  return (
    <section className="border-t border-white/8">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <h2 className="font-display text-[28px] font-black leading-[1.05] tracking-[-0.015em] md:text-[36px]">
          How it works
        </h2>

        <ol className="mt-6 grid gap-3 sm:grid-cols-3">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <li
                key={step.title}
                className="rounded-[18px] border border-white/10 bg-panel p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-[12px] bg-brand/12 text-brand-light">
                    <Icon aria-hidden="true" size={18} />
                  </span>
                  <span
                    aria-hidden="true"
                    className="font-display text-[24px] font-black text-white/12"
                  >
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-3.5 font-display text-[16px] font-black leading-tight text-white">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-[13px] leading-6 text-muted">
                  {step.text}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
