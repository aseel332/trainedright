import type { Metadata } from "next";
import { PopularSearches } from "@/components/popular-searches";
import { TrainerListingClient } from "@/components/trainer-listing-client";
import { getStories, getTrainers } from "@/lib/server/data";
import { cityOptions, searchCategories } from "@/lib/search-categories";
import { citySlugOf, seoProfessions } from "@/lib/seo-pages";

type ListingSearchParams = { [key: string]: string | string[] | undefined };

/** `cat` may be comma-separated (e.g. from the home hero: ?cat=gym,sport). */
function parseCategoryIds(params: ListingSearchParams) {
  const rawCats = Array.isArray(params.cat)
    ? params.cat.join(",")
    : typeof params.cat === "string"
      ? params.cat
      : "";
  return Array.from(
    new Set(
      rawCats
        .split(",")
        .map((value) => value.trim())
        .filter((id) => searchCategories.some((category) => category.id === id)),
    ),
  );
}

/**
 * Filtered listing views duplicate the profession/city landing pages, so
 * their canonical points at the clean, indexable URL for that filter combo.
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<ListingSearchParams>;
}): Promise<Metadata> {
  const params = await searchParams;
  const categoryIds = parseCategoryIds(params);
  const cityParam = typeof params.city === "string" ? params.city : "";
  const city =
    cityOptions.find(
      (option) => option.name.toLowerCase() === cityParam.trim().toLowerCase(),
    ) ?? null;
  const hasQuery = typeof params.q === "string" && params.q.trim().length > 0;

  const profession = !hasQuery
    ? (seoProfessions.find((option) =>
        categoryIds.length === 1
          ? option.categoryIds.length === 1 &&
            option.categoryIds[0] === categoryIds[0]
          : categoryIds.length === 0 && option.categoryIds.length === 0,
      ) ?? null)
    : null;

  let canonical = "/trainers";
  let title = "Browse Fitness Trainers, Sports Coaches & Dietitians";
  if (profession && city) {
    canonical = `/${profession.slug}/${citySlugOf(city.name)}`;
    title = `${profession.plural} in ${city.name}`;
  } else if (profession && categoryIds.length === 1) {
    canonical = `/${profession.slug}`;
    title = `${profession.plural} in India`;
  }

  return {
    title,
    description:
      "Search and filter verified fitness trainers, gym coaches, sports coaches, yoga instructors and dietitians across India. Compare reviews, real transformations and prices.",
    alternates: { canonical },
  };
}

export default async function TrainersPage({
  searchParams,
}: {
  searchParams: Promise<ListingSearchParams>;
}) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  const city = typeof params.city === "string" ? params.city : "";
  const initialCategories = parseCategoryIds(params);
  const [trainers, stories] = await Promise.all([getTrainers(), getStories()]);

  return (
    <main className="min-h-screen bg-background pb-14 text-white">
      <TrainerListingClient
        trainers={trainers}
        stories={stories}
        initialQuery={query}
        initialCity={city}
        initialCategories={initialCategories}
      />
      <PopularSearches />
    </main>
  );
}
