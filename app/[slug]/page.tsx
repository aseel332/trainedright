import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  cityBySlug,
  citySlugOf,
  launchedCities,
  professionBySlug,
  seoProfessions,
} from "@/lib/seo-pages";
import { CityHubPage, cityMetadata } from "./city-page";
import { ProfessionHubPage, professionMetadata } from "./profession-page";

/**
 * One top-level dynamic segment serves two page families:
 *   /mumbai            → city hub (hero, stories, search + listing)
 *   /personal-trainers → profession hub (SEO page linking city landing pages)
 * Both are statically generated and refreshed hourly; anything else 404s at
 * the router (dynamicParams=false).
 */
export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  // Only launched cities get pages; everything else 404s (dynamicParams=false).
  return [
    ...seoProfessions.map((profession) => ({ slug: profession.slug })),
    ...launchedCities.map((city) => ({ slug: citySlugOf(city.name) })),
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  const profession = professionBySlug(slug);
  if (profession) {
    return professionMetadata(profession);
  }

  const city = cityBySlug(slug);
  if (city) {
    return cityMetadata(city);
  }

  return {};
}

export default async function TopLevelSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const profession = professionBySlug(slug);
  if (profession) {
    return <ProfessionHubPage profession={profession} />;
  }

  const city = cityBySlug(slug);
  if (city) {
    return <CityHubPage city={city} />;
  }

  notFound();
}
