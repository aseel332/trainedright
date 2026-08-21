import { BadgeCheck, MessageCircle, Search } from "lucide-react";

/**
 * How the product actually works, described in mechanics rather than promises.
 * Each line is something a visitor can verify on the very next page: the
 * filters exist, the verified badge means a client submitted it through their
 * own link, and the contact button opens WhatsApp with no account in between.
 */
const STEPS = [
  {
    title: "Search your city",
    text: "Filter by coach type, sport, speciality, price and experience. Every coach listed works in that city — nothing is imported or scraped.",
    icon: Search,
  },
  {
    title: "Check the proof",
    text: "Reviews and before/afters marked verified were submitted by the client through a private link. Credentials are checked by us before a profile goes live.",
    icon: BadgeCheck,
  },
  {
    title: "Message them directly",
    text: "Contact opens WhatsApp with the coach. You agree the session and the price between you — TrainedRight takes no cut and no booking fee.",
    icon: MessageCircle,
  },
];

export function HomeHowItWorks() {
  return (
    <section className="border-t border-white/8">
      <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-9 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:gap-14">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-brand-light">
              How it works
            </p>
            <h2 className="mt-2.5 font-display text-[30px] font-black leading-[1.02] tracking-[-0.01em] md:text-[42px]">
              Three steps, no account needed.
            </h2>
            <p className="mt-3.5 text-[14px] leading-7 text-muted md:text-[15px]">
              You never sign up to browse, message a coach, or book your first
              session. Accounts are for coaches.
            </p>
          </div>

          <ol className="grid gap-3 sm:grid-cols-3">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <li
                  key={step.title}
                  className="rounded-[20px] border border-white/10 bg-panel p-5"
                >
                  <div className="flex items-center justify-between">
                    <span className="grid h-11 w-11 place-items-center rounded-[14px] bg-brand/12 text-brand-light">
                      <Icon aria-hidden="true" size={20} />
                    </span>
                    <span
                      aria-hidden="true"
                      className="font-display text-[26px] font-black text-white/12"
                    >
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-[17px] font-black leading-tight text-white">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-6 text-muted">
                    {step.text}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
