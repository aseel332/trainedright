import type { Metadata } from "next";
import { TrainerListingClient } from "@/components/trainer-listing-client";
import { getStories, getTrainers } from "@/lib/server/data";
import { searchCategories } from "@/lib/search-categories";

export const metadata: Metadata = {
  title: "Browse Trainers | TrainedRight",
  description: "Search and filter trainers on TrainedRight.",
};

export default async function TrainersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  const city = typeof params.city === "string" ? params.city : "";
  // `cat` may be comma-separated (e.g. from the home hero: ?cat=gym,sport).
  const rawCats = Array.isArray(params.cat)
    ? params.cat.join(",")
    : typeof params.cat === "string"
      ? params.cat
      : "";
  const initialCategories = Array.from(
    new Set(
      rawCats
        .split(",")
        .map((value) => value.trim())
        .filter((id) => searchCategories.some((category) => category.id === id)),
    ),
  );
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
    </main>
  );
}
