import type { Metadata } from "next";
import { TrainerListingClient } from "@/components/trainer-listing-client";
import { getTrainers } from "@/lib/data";

export const metadata: Metadata = {
  title: "Browse Trainers | TrainedRight",
  description: "Search and filter verified trainers on TrainedRight.",
};

export default async function TrainersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  const verified = params.verified === "true";
  const trainers = await getTrainers();

  return (
    <main className="min-h-screen bg-background pb-14 text-white">
      <TrainerListingClient
        trainers={trainers}
        initialQuery={query}
        initialVerified={verified}
      />
    </main>
  );
}
