import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import type { SearchCategory } from "@/lib/search-categories";

export type GoalLink = {
  category: SearchCategory;
  count: number;
  href: string;
};

export type CityLink = {
  name: string;
  state: string;
  href: string;
  count: number;
};

/**
 * Browse-by-goal. Only coach types somebody has actually published under
 * appear, and each carries its live count — a category that sends the visitor
 * to an empty listing is worse than no category at all.
 */
export function HomeGoals({ goals }: { goals: GoalLink[] }) {
  if (goals.length === 0) {
    return null;
  }

  return (
    <section className="border-t border-white/8">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <h2 className="font-display text-[28px] font-black leading-[1.05] tracking-[-0.015em] md:text-[36px]">
          Browse by goal
        </h2>

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {/* Label and live count only. The category descriptions repeated
              what the labels already say and cost three wrapped lines each on
              a phone. */}
          {goals.map(({ category, count, href }) => (
            <Link
              key={category.id}
              href={href}
              className="group flex min-h-[112px] flex-col justify-between rounded-[18px] border border-white/10 bg-panel p-4 transition hover:-translate-y-0.5 hover:border-brand/40 hover:bg-panel-strong sm:p-5"
            >
              <span
                aria-hidden="true"
                className="inline-block h-2 w-9 rounded-full"
                style={{ backgroundColor: category.tint }}
              />
              <span>
                <h3 className="mt-4 font-display text-[16px] font-black leading-tight text-white sm:text-[18px]">
                  {category.label}
                </h3>
                <span className="mt-1.5 flex items-center gap-1.5 text-[12px] font-extrabold text-muted">
                  {count} {count === 1 ? "coach" : "coaches"}
                  <ArrowRight
                    aria-hidden="true"
                    size={13}
                    className="text-brand-light opacity-0 transition group-hover:opacity-100"
                  />
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * City hubs. Live cities show their real coach count; the rest are honestly
 * marked as not open yet rather than given an invented number.
 */
export function HomeCities({
  live,
  upcoming,
}: {
  live: CityLink[];
  upcoming: { name: string; state: string }[];
}) {
  if (live.length === 0) {
    return null;
  }

  return (
    <section id="cities" className="border-t border-white/8 bg-panel/25">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <h2 className="font-display text-[28px] font-black leading-[1.05] tracking-[-0.015em] md:text-[36px]">
          Pick your city
        </h2>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {live.map((city) => (
            <Link
              key={city.name}
              href={city.href}
              className="group flex items-center justify-between gap-4 rounded-[18px] border border-white/10 bg-panel px-5 py-4 transition hover:-translate-y-0.5 hover:border-brand/40 hover:bg-panel-strong"
            >
              <span className="min-w-0">
                <span className="flex items-center gap-2 font-display text-[19px] font-black text-white">
                  <MapPin
                    aria-hidden="true"
                    size={16}
                    className="flex-none text-brand-light"
                  />
                  {city.name}
                </span>
                <span className="mt-1 block text-[12px] font-semibold text-muted">
                  {city.state} · {city.count}{" "}
                  {city.count === 1 ? "coach" : "coaches"}
                </span>
              </span>
              <ArrowRight
                aria-hidden="true"
                size={17}
                className="flex-none text-muted transition group-hover:translate-x-0.5 group-hover:text-brand-light"
              />
            </Link>
          ))}
        </div>

        {upcoming.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded-[16px] border border-dashed border-white/10 px-4 py-3.5">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-muted">
              Opening next
            </span>
            <span className="text-[13px] font-semibold text-soft">
              {upcoming.map((city) => city.name).join(" · ")}
            </span>
            <Link
              href="/trainer"
              className="text-[12.5px] font-extrabold text-brand-light transition hover:text-brand"
            >
              Coach there? Get listed first
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
