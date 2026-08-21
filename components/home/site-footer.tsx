import Link from "next/link";
import { seoProfessions } from "@/lib/seo-pages";

export function HomeFooter({
  cities,
}: {
  cities: { name: string; href: string }[];
}) {
  return (
    <footer className="border-t border-white/8 bg-panel/25">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-9 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <p className="font-display text-[22px] font-black leading-none">
              TRAINED<span className="text-brand">RIGHT</span>
            </p>
            <p className="mt-3 max-w-xs text-[13px] font-medium leading-6 text-muted">
              Find the right coach for your story. Free to browse, free to
              contact.
            </p>
          </div>

          <nav aria-labelledby="footer-coach-types">
            <h2
              id="footer-coach-types"
              className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-muted"
            >
              Coach types
            </h2>
            <ul className="mt-4 space-y-2.5">
              {seoProfessions.map((profession) => (
                <li key={profession.slug}>
                  <Link
                    href={`/${profession.slug}`}
                    className="text-[13px] font-bold text-soft transition hover:text-white"
                  >
                    {profession.plural}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {cities.length > 0 ? (
            <nav aria-labelledby="footer-cities">
              <h2
                id="footer-cities"
                className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-muted"
              >
                Cities
              </h2>
              <ul className="mt-4 space-y-2.5">
                {cities.map((city) => (
                  <li key={city.name}>
                    <Link
                      href={city.href}
                      className="text-[13px] font-bold text-soft transition hover:text-white"
                    >
                      Coaches in {city.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}

          <nav aria-labelledby="footer-coaches">
            <h2
              id="footer-coaches"
              className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-muted"
            >
              For coaches
            </h2>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link
                  href="/trainer"
                  className="text-[13px] font-bold text-soft transition hover:text-white"
                >
                  How listing works
                </Link>
              </li>
              <li>
                <Link
                  href="/trainer/auth?mode=signup&next=/trainer/onboarding"
                  className="text-[13px] font-bold text-soft transition hover:text-white"
                >
                  List your coaching
                </Link>
              </li>
              <li>
                <Link
                  href="/trainer/auth?mode=signin&next=/trainer/dashboard"
                  className="text-[13px] font-bold text-soft transition hover:text-white"
                >
                  Trainer log in
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <p className="mt-10 border-t border-white/8 pt-6 text-[12px] font-semibold text-muted">
          © {new Date().getFullYear()} TrainedRight. Coaches proven by clients,
          not ads.
        </p>
      </div>
    </footer>
  );
}
