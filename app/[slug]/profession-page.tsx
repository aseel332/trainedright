import type { Metadata } from "next";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { SiteHeader } from "@/components/site-header";
import { TrainerCard } from "@/components/trainer-card";
import { cityOptions } from "@/lib/search-categories";
import {
  citySlugOf,
  isCityLaunched,
  seoProfessions,
  type SeoProfession,
} from "@/lib/seo-pages";
import { listActiveTrainers } from "@/lib/server/data";
import { siteUrl } from "@/lib/site";
import { filterAndSortTrainers } from "@/lib/trainer-utils";

/**
 * Profession hub ("Personal Trainers in India"): links every city landing
 * page and shows the top-rated coaches nationally.
 */

async function hubTrainers(profession: SeoProfession) {
  return filterAndSortTrainers(await listActiveTrainers(), {
    categories: profession.categoryIds,
    sort: "rating",
  });
}

export function professionMetadata(profession: SeoProfession): Metadata {
  const title = `${profession.plural} in India — Compare Verified Coaches`;
  const description = `Find ${profession.plural.toLowerCase()} across India for ${profession.helpsWith}. Compare verified reviews, client transformations and prices city by city, then chat on WhatsApp — free.`;

  return {
    title,
    description,
    alternates: { canonical: `/${profession.slug}` },
    openGraph: { title, description, url: `/${profession.slug}` },
  };
}

export async function ProfessionHubPage({
  profession,
}: {
  profession: SeoProfession;
}) {
  const trainers = await hubTrainers(profession);
  const topTrainers = trainers.slice(0, 12);
  const countByCity = new Map<string, number>();
  for (const trainer of trainers) {
    countByCity.set(trainer.city, (countByCity.get(trainer.city) ?? 0) + 1);
  }
  const otherProfessions = seoProfessions.filter(
    (option) => option.slug !== profession.slug,
  );

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      {
        "@type": "ListItem",
        position: 2,
        name: profession.plural,
        item: `${siteUrl}/${profession.slug}`,
      },
    ],
  };

  return (
    <main className="min-h-screen bg-background pb-16 text-white">
      <JsonLd data={breadcrumbJsonLd} />
      <SiteHeader />

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav
          aria-label="Breadcrumb"
          className="pt-6 text-[12px] font-semibold text-muted"
        >
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="transition hover:text-white">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-soft">
              {profession.plural}
            </li>
          </ol>
        </nav>

        <header className="mt-6 max-w-3xl">
          <h1 className="font-display text-[34px] font-black leading-[1.02] md:text-[48px]">
            {profession.plural} in India
          </h1>
          <p className="mt-4 text-[14px] leading-7 text-soft md:text-[15px]">
            Compare verified {profession.plural.toLowerCase()} for{" "}
            {profession.helpsWith}. Pick your city to see coaches near you,
            with real client reviews, transformations and prices on every
            profile.
          </p>
        </header>

        <section className="mt-8">
          <h2 className="font-display text-[20px] font-black md:text-[24px]">
            Browse by city
          </h2>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {cityOptions.map((city) => {
              const count = countByCity.get(city.name) ?? 0;
              if (!isCityLaunched(city.name)) {
                return (
                  <li key={city.name}>
                    <div className="flex min-h-[74px] flex-col justify-center rounded-[16px] border border-white/5 bg-panel/50 px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-[14px] font-extrabold text-white/35">
                        <MapPin aria-hidden="true" size={14} className="text-white/20" />
                        {city.name}
                      </span>
                      <span className="mt-1 text-[10.5px] font-bold uppercase tracking-[0.08em] text-white/25">
                        Coming soon
                      </span>
                    </div>
                  </li>
                );
              }
              return (
                <li key={city.name}>
                  <Link
                    href={`/${profession.slug}/${citySlugOf(city.name)}`}
                    className="flex min-h-[74px] flex-col justify-center rounded-[16px] border border-white/10 bg-panel px-4 py-3 transition hover:border-brand/50 hover:bg-panel-strong"
                  >
                    <span className="inline-flex items-center gap-1.5 text-[14px] font-extrabold">
                      <MapPin aria-hidden="true" size={14} className="text-brand-light" />
                      {city.name}
                    </span>
                    <span className="mt-1 text-[11.5px] font-semibold text-muted">
                      {count > 0
                        ? `${count} ${count === 1 ? "coach" : "coaches"} listed`
                        : city.state}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        {topTrainers.length > 0 ? (
          <section className="mt-12">
            <h2 className="font-display text-[20px] font-black md:text-[24px]">
              Top-rated {profession.plural.toLowerCase()}
            </h2>
            <div className="mt-4 grid gap-x-6 md:grid-cols-2 md:gap-y-4 xl:grid-cols-3">
              {topTrainers.map((trainer) => (
                <TrainerCard key={trainer.id} trainer={trainer} showPrice />
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-12">
          <h2 className="font-display text-[18px] font-black text-soft">
            More coach types
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {otherProfessions.map((option) => (
              <li key={option.slug}>
                <Link
                  href={`/${option.slug}`}
                  className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[13px] font-bold text-soft transition hover:border-brand/50 hover:text-white"
                >
                  {option.plural}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
