import Link from "next/link";
import { citySlugOf, launchedCities, seoProfessions } from "@/lib/seo-pages";

/**
 * Footer link mesh into the profession/city landing pages. Keeps those pages
 * discoverable by crawlers (never orphaned) and passes descriptive anchor
 * text like "Personal Trainers in Ahmedabad". Only launched cities appear.
 */
export function PopularSearches() {
  const featuredCities = launchedCities.slice(0, 5);

  return (
    <section aria-label="Popular searches" className="border-t border-white/10">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h2 className="font-display text-[18px] font-black text-soft">
          Popular searches
        </h2>
        <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
          {seoProfessions.map((profession) => (
            <div key={profession.slug}>
              <Link
                href={`/${profession.slug}`}
                className="text-[13px] font-extrabold text-white transition hover:text-brand-light"
              >
                {profession.plural}
              </Link>
              <ul className="mt-3 space-y-2">
                {featuredCities.map((city) => (
                  <li key={city.name}>
                    <Link
                      href={`/${profession.slug}/${citySlugOf(city.name)}`}
                      className="text-[12.5px] font-semibold leading-5 text-muted transition hover:text-white"
                    >
                      {profession.plural} in {city.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
