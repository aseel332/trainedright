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
      <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-brand-light">
            Browse by goal
          </p>
          <h2 className="mt-2.5 font-display text-[30px] font-black leading-[1.02] tracking-[-0.01em] md:text-[42px]">
            What are you training for?
          </h2>
        </div>

        <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {goals.map(({ category, count, href }) => (
            <Link
              key={category.id}
              href={href}
              className="group relative overflow-hidden rounded-[20px] border border-white/10 bg-panel p-5 transition hover:-translate-y-0.5 hover:border-brand/40 hover:bg-panel-strong"
            >
              <span
                aria-hidden="true"
                className="inline-block h-2.5 w-10 rounded-full"
                style={{ backgroundColor: category.tint }}
              />
              <h3 className="mt-4 font-display text-[19px] font-black leading-tight text-white">
                {category.label}
              </h3>
              <p className="mt-1.5 text-[13px] font-medium leading-6 text-muted">
                {category.description}
              </p>
              <span className="mt-4 flex items-center justify-between gap-2 text-[12px] font-extrabold">
                <span className="text-soft">
                  {count} {count === 1 ? "coach" : "coaches"}
                </span>
                <span className="inline-flex items-center gap-1 text-brand-light opacity-0 transition group-hover:opacity-100">
                  Browse
                  <ArrowRight aria-hidden="true" size={14} />
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
      <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-brand-light">
            Where we&apos;re live
          </p>
          <h2 className="mt-2.5 font-display text-[30px] font-black leading-[1.02] tracking-[-0.01em] md:text-[42px]">
            Pick your city.
          </h2>
          <p className="mt-3.5 text-[14px] leading-7 text-muted md:text-[15px]">
            We open a city only once there are real coaches in it, so every name
            below is a listing you can actually book from today.
          </p>
        </div>

        <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
          <div className="mt-6 rounded-[18px] border border-dashed border-white/10 px-5 py-4">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-muted">
              Opening next
            </p>
            <p className="mt-2 text-[13.5px] font-semibold leading-6 text-soft">
              {upcoming.map((city) => city.name).join(" · ")}
            </p>
            <p className="mt-2 text-[12.5px] font-medium leading-6 text-muted">
              Coach in one of these cities?{" "}
              <Link
                href="/trainer"
                className="font-extrabold text-brand-light transition hover:text-brand"
              >
                Get listed first
              </Link>{" "}
              and you open the city.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
