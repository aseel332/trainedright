import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { CityIcon } from "@/components/city-icon";
import { JsonLd } from "@/components/json-ld";
import { StoryCard } from "@/components/story-card";
import { TrainerListingClient } from "@/components/trainer-listing-client";
import {
  citySlugOf,
  seoProfessions,
  type CityOption,
} from "@/lib/seo-pages";
import { listActiveStories, listActiveTrainers } from "@/lib/server/data";
import { siteUrl } from "@/lib/site";
import { filterAndSortTrainers } from "@/lib/trainer-utils";

/**
 * The city hub — the site's main destination per city (`/ahmedabad`).
 * Deliberately spare: a slim branded header, the stories rail, then the
 * coaches with search and filters — everything above stays compact so the
 * coach list is visible without scrolling far.
 */

// Deduped across generateMetadata + page by react cache inside the fetchers.
async function cityData(city: CityOption) {
  const [allTrainers, allStories] = await Promise.all([
    listActiveTrainers(),
    listActiveStories(),
  ]);

  const trainers = filterAndSortTrainers(allTrainers, { city: city.name });
  const trainerIds = new Set(trainers.map((trainer) => trainer.id));
  const localStories = allStories.filter(
    (story) => story.trainerId && trainerIds.has(story.trainerId),
  );
  // Until the city has its own stories, show the marketplace's featured ones
  // so the rail never opens empty.
  const stories =
    localStories.length > 0
      ? localStories
      : allStories.filter((story) => story.isFeatured);

  const slugByTrainerId = new Map(
    allTrainers.map((trainer) => [trainer.id, trainer.slug]),
  );

  return { trainers, stories: stories.slice(0, 6), slugByTrainerId };
}

export async function cityMetadata(city: CityOption): Promise<Metadata> {
  const { trainers } = await cityData(city);
  const path = `/${citySlugOf(city.name)}`;
  const title = `${city.name} — Fitness Trainers, Coaches & Stories`;
  const description = `Your fitness hub for ${city.name}, ${city.state}: ${
    trainers.length > 0
      ? `${trainers.length} verified ${trainers.length === 1 ? "coach" : "coaches"}`
      : "verified coaches"
  } across gym, sports, yoga and nutrition, plus real transformation stories. Compare and chat on WhatsApp — free.`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path },
    // Keep thin pages out of the index until the city has coaches.
    robots: trainers.length === 0 ? { index: false, follow: true } : undefined,
  };
}

export async function CityHubPage({ city }: { city: CityOption }) {
  const { trainers, stories, slugByTrainerId } = await cityData(city);
  const cSlug = citySlugOf(city.name);
  const pageUrl = `${siteUrl}/${cSlug}`;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: city.name, item: pageUrl },
    ],
  };

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Coaches in ${city.name}`,
    numberOfItems: trainers.length,
    itemListElement: trainers.map((trainer, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: trainer.name,
      url: `${siteUrl}/trainers/${trainer.slug}`,
    })),
  };

  return (
    <main className="min-h-screen bg-background pb-14 text-white">
      <JsonLd data={breadcrumbJsonLd} />
      {trainers.length > 0 ? <JsonLd data={itemListJsonLd} /> : null}

      {/* City header: brand on the left, the current city — small, and a
          link back to the hero so a trainer/visitor can switch cities. */}
      <header className="border-b border-white/10">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <BrandLogo compact />
          <Link
            href="/"
            aria-label={`${city.name} — change city`}
            className="group flex flex-none flex-col items-end gap-1"
          >
            <CityIcon
              city={cSlug}
              className="h-8 w-auto text-soft/70 transition group-hover:text-brand-light md:h-9"
            />
            <h1 className="text-[12px] font-extrabold text-white transition group-hover:text-brand-light md:text-[13px]">
              {city.name}
            </h1>
          </Link>
        </div>
      </header>

      {/* Stories: one full-width card per screen on mobile, two on desktop. */}
      {stories.length > 0 ? (
        <section
          aria-label="Coach stories"
          className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6 lg:px-8"
        >
          <h2 className="mb-4 text-[11px] font-extrabold uppercase tracking-[0.22em] text-muted">
            Stories from our coaches
          </h2>
          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1 scrollbar-none">
            {stories.map((story) => {
              const slug = story.trainerId
                ? slugByTrainerId.get(story.trainerId)
                : undefined;
              return (
                <StoryCard
                  key={story.id}
                  story={story}
                  size="banner"
                  href={
                    slug ? `/trainers/${slug}/stories/${story.id}` : undefined
                  }
                />
              );
            })}
          </div>
        </section>
      ) : null}

      {/* Coaches: search, filters and the list. */}
      <section
        id="coaches"
        className="mx-auto w-full max-w-7xl px-4 pt-7 sm:px-6 lg:px-8"
      >
        <div className="mb-4 flex items-baseline gap-2.5">
          <h2 className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-muted">
            Coaches
          </h2>
          <span className="text-[12px] font-bold text-soft">
            {trainers.length}
          </span>
        </div>

        {trainers.length > 0 ? (
          <TrainerListingClient trainers={trainers} />
        ) : (
          <div className="rounded-[18px] border border-white/10 bg-panel p-8 text-center">
            <p className="font-display text-lg font-black">
              Coaches are joining {city.name} now
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
              New verified coaches go live every week — check back soon.
            </p>
          </div>
        )}
      </section>

      {/* Quiet SEO links, out of the way. */}
      <footer className="mx-auto w-full max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
        <nav
          aria-label={`Popular searches in ${city.name}`}
          className="flex flex-wrap gap-x-5 gap-y-2 border-t border-white/10 pt-5"
        >
          {seoProfessions.map((profession) => (
            <Link
              key={profession.slug}
              href={`/${profession.slug}/${cSlug}`}
              className="text-[12px] font-semibold text-muted transition hover:text-white"
            >
              {profession.plural} in {city.name}
            </Link>
          ))}
        </nav>
      </footer>
    </main>
  );
}
