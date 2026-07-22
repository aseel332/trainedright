import type { MetadataRoute } from "next";
import { cityOptions } from "@/lib/search-categories";
import { citySlugOf, seoProfessions } from "@/lib/seo-pages";
import { createPublicServerClient } from "@/lib/server/supabase-public";
import { siteUrl } from "@/lib/site";

/**
 * One sitemap for the whole marketplace (well under the 50k URL limit):
 * static pages, the profession/city landing pages, and every live trainer
 * profile, story article and transformation page — with image extensions so
 * profile photos and before/afters can surface in image search.
 * Regenerated hourly.
 */
export const revalidate = 3600;

type TrainerRow = {
  id: string;
  slug: string;
  city: string;
  specialties: string[] | null;
  updated_at: string | null;
  card_image_url: string | null;
  hero_image_url: string | null;
};

type StoryRow = {
  id: string;
  trainer_id: string | null;
  image_url: string | null;
  updated_at: string | null;
};

type TransformationRow = {
  id: string;
  trainer_id: string;
  before_image_url: string | null;
  after_image_url: string | null;
  updated_at: string | null;
};

function absoluteImages(urls: (string | null | undefined)[]) {
  const images = urls.filter(
    (url): url is string => Boolean(url) && /^https?:\/\//.test(url as string),
  );
  return images.length > 0 ? images : undefined;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: now, changeFrequency: "daily", priority: 1 },
    {
      url: `${siteUrl}/trainers`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/trainer`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  for (const profession of seoProfessions) {
    entries.push({
      url: `${siteUrl}/${profession.slug}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    });
  }

  const supabase = createPublicServerClient();

  let trainers: TrainerRow[] = [];
  let stories: StoryRow[] = [];
  let transformations: TransformationRow[] = [];

  if (supabase) {
    const [trainersResult, storiesResult, transformationsResult] =
      await Promise.all([
        supabase
          .from("trainers")
          .select(
            "id, slug, city, specialties, updated_at, card_image_url, hero_image_url",
          )
          .eq("is_active", true),
        supabase
          .from("stories")
          .select("id, trainer_id, image_url, updated_at")
          .eq("is_active", true),
        supabase
          .from("trainer_transformations")
          .select("id, trainer_id, before_image_url, after_image_url, updated_at"),
      ]);

    trainers = (trainersResult.data ?? []) as TrainerRow[];
    stories = (storiesResult.data ?? []) as StoryRow[];
    transformations = (transformationsResult.data ?? []) as TransformationRow[];
  }

  // City landing pages: only combos with at least one coach when the DB is
  // reachable (empty combos are noindexed), every combo otherwise.
  for (const profession of seoProfessions) {
    for (const city of cityOptions) {
      const hasInventory = trainers.some(
        (trainer) =>
          trainer.city === city.name &&
          (profession.categoryIds.length === 0 ||
            profession.categoryIds.some((id) =>
              (trainer.specialties ?? []).includes(id),
            )),
      );

      if (!supabase || hasInventory) {
        entries.push({
          url: `${siteUrl}/${profession.slug}/${citySlugOf(city.name)}`,
          lastModified: now,
          changeFrequency: "daily",
          priority: 0.7,
        });
      }
    }
  }

  const slugById = new Map(trainers.map((trainer) => [trainer.id, trainer.slug]));

  for (const trainer of trainers) {
    entries.push({
      url: `${siteUrl}/trainers/${trainer.slug}`,
      lastModified: trainer.updated_at ? new Date(trainer.updated_at) : now,
      changeFrequency: "weekly",
      priority: 0.8,
      images: absoluteImages([trainer.card_image_url, trainer.hero_image_url]),
    });
  }

  for (const story of stories) {
    const slug = story.trainer_id ? slugById.get(story.trainer_id) : undefined;
    if (!slug) {
      continue;
    }
    entries.push({
      url: `${siteUrl}/trainers/${slug}/stories/${story.id}`,
      lastModified: story.updated_at ? new Date(story.updated_at) : now,
      changeFrequency: "monthly",
      priority: 0.6,
      images: absoluteImages([story.image_url]),
    });
  }

  for (const transformation of transformations) {
    const slug = slugById.get(transformation.trainer_id);
    if (!slug) {
      continue;
    }
    entries.push({
      url: `${siteUrl}/trainers/${slug}/transformations/${transformation.id}`,
      lastModified: transformation.updated_at
        ? new Date(transformation.updated_at)
        : now,
      changeFrequency: "monthly",
      priority: 0.5,
      images: absoluteImages([
        transformation.before_image_url,
        transformation.after_image_url,
      ]),
    });
  }

  return entries;
}
