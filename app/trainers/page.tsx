import type { Metadata } from "next";
import { TrainerListingClient } from "@/components/trainer-listing-client";
import { getTrainers } from "@/lib/server/data";
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
  const cat =
    typeof params.cat === "string" &&
    searchCategories.some((category) => category.id === params.cat)
      ? params.cat
      : "";
  const trainers = await getTrainers();

  return (
    <main className="min-h-screen bg-background pb-14 text-white">
      <TrainerListingClient
        trainers={trainers}
        initialQuery={query}
        initialCity={city}
        initialCategory={cat}
      />
    </main>
  );
}
