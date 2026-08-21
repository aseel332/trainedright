import "server-only";

import { cache } from "react";
import {
  listActiveReviews,
  listActiveStories,
  listActiveTrainers,
  listActiveTransformations,
} from "@/lib/server/data";
import { createPublicServerClient } from "@/lib/server/supabase-public";
import {
  HOME_SETTINGS_ID,
  applyFeaturedOrder,
  defaultHomeSettings,
  parseHomeSettings,
  type HomeSettings,
} from "@/lib/home-settings";
import { cityOptions, searchCategories } from "@/lib/search-categories";
import { isCityLaunched } from "@/lib/seo-pages";
import type { Story, Trainer, Transformation } from "@/lib/types";

/** A verified client review, carrying the coach it was written about. */
export type HomeReview = {
  id: string;
  clientName: string;
  clientInitials: string;
  avatarColor: string;
  rating: number;
  reviewText: string;
  whenLabel: string;
  isVerified: boolean;
  trainerName: string;
  trainerSlug: string;
  trainerAvatarUrl: string;
  trainerCity: string;
};

/** A confirmed before/after, carrying the coach who trained the client. */
export type HomeTransformation = Transformation & {
  trainerName: string;
  trainerSlug: string;
  trainerCity: string;
};

/** Live counts computed from published data — never hand-entered. */
export type HomeNumbers = {
  coachCount: number;
  /** Launched cities that actually have at least one published coach. */
  liveCityCount: number;
  reviewCount: number;
  verifiedReviewCount: number;
  transformationCount: number;
  /** Mean rating across coaches who have one; 0 when nobody is rated yet. */
  averageRating: number;
  ratedCoachCount: number;
  /** Cheapest published starting price, or 0 when no coach lists one. */
  lowestPriceInr: number;
  /** Coaches per search-category id. */
  categoryCounts: Record<string, number>;
  /** Coaches per city name. */
  cityCounts: Record<string, number>;
  /** The city with the most coaches — the one the hero names. */
  primaryCity: string;
};

export type HomeContent = {
  settings: HomeSettings;
  numbers: HomeNumbers;
  /** Ordered coaches to lead with (admin pick first, else best proof first). */
  featuredTrainers: Trainer[];
  reviews: HomeReview[];
  transformations: HomeTransformation[];
  stories: Story[];
};

/**
 * The editorial settings row.
 *
 * `site_settings` ships in a migration that is applied by hand, so a missing
 * table is an expected state, not an error: the landing page renders from
 * defaults and the admin console explains what to run. `available` is what the
 * console checks.
 */
export const getHomeSettings = cache(
  async (): Promise<{ settings: HomeSettings; available: boolean }> => {
    const supabase = createPublicServerClient();

    if (!supabase) {
      return { settings: defaultHomeSettings, available: false };
    }

    const { data, error } = await supabase
      .from("site_settings")
      .select("content")
      .eq("id", HOME_SETTINGS_ID)
      .maybeSingle();

    if (error) {
      return { settings: defaultHomeSettings, available: false };
    }

    // No row yet (table exists but was never seeded) is still "available":
    // the first save will create it.
    return { settings: parseHomeSettings(data?.content), available: true };
  },
);

/**
 * How strong a coach's public proof is. Drives the automatic ordering when an
 * admin has not pinned an explicit list: coaches with real client evidence lead,
 * and the manual `sort_rank` breaks ties.
 */
function proofScore(trainer: Trainer, transformationCount: number) {
  return (
    trainer.rating * 4 +
    Math.min(trainer.reviewCount, 20) * 2 +
    transformationCount * 6
  );
}

function countBy<T>(items: T[], keysOf: (item: T) => string[]) {
  const counts: Record<string, number> = {};

  for (const item of items) {
    for (const key of keysOf(item)) {
      counts[key] = (counts[key] ?? 0) + 1;
    }
  }

  return counts;
}

function computeNumbers(
  trainers: Trainer[],
  reviews: { isVerified: boolean }[],
  transformations: unknown[],
): HomeNumbers {
  const rated = trainers.filter((trainer) => trainer.rating > 0);
  const priced = trainers
    .map((trainer) => trainer.priceFromInr)
    .filter((price) => price > 0);

  const cityCounts = countBy(trainers, (trainer) => [trainer.city]);
  const categoryCounts = countBy(trainers, (trainer) => trainer.categories);

  const primaryCity =
    Object.entries(cityCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ??
    cityOptions.find((city) => isCityLaunched(city.name))?.name ??
    "";

  return {
    coachCount: trainers.length,
    liveCityCount: Object.keys(cityCounts).filter((city) =>
      isCityLaunched(city),
    ).length,
    reviewCount: reviews.length,
    verifiedReviewCount: reviews.filter((review) => review.isVerified).length,
    transformationCount: transformations.length,
    averageRating:
      rated.length > 0
        ? rated.reduce((total, trainer) => total + trainer.rating, 0) /
          rated.length
        : 0,
    ratedCoachCount: rated.length,
    lowestPriceInr: priced.length > 0 ? Math.min(...priced) : 0,
    categoryCounts,
    cityCounts,
    primaryCity,
  };
}

/**
 * Everything the landing page renders, assembled from published marketplace
 * data and the editorial settings row.
 *
 * Deliberately built from the `listActive*` readers rather than the `get*`
 * ones: those call `connection()` and would force the home page to render on
 * every request. The page is ISR'd instead, and the admin console already
 * sweeps it with `revalidatePath` whenever a trainer or these settings change.
 */
export const getHomeContent = cache(async (): Promise<HomeContent> => {
  const [{ settings }, trainers, reviews, transformations, stories] =
    await Promise.all([
      getHomeSettings(),
      listActiveTrainers(),
      listActiveReviews(),
      listActiveTransformations(),
      listActiveStories(),
    ]);

  const trainersById = new Map(trainers.map((trainer) => [trainer.id, trainer]));

  // RLS scopes both to active trainers, but a row can still outlive its coach
  // between a delete and a cache sweep — drop anything we cannot attribute.
  const attributedTransformations: HomeTransformation[] = transformations
    .map((item) => {
      const trainer = trainersById.get(item.trainerId);
      return trainer
        ? {
            ...item,
            trainerName: trainer.name,
            trainerSlug: trainer.slug,
            trainerCity: trainer.city,
          }
        : null;
    })
    .filter((item): item is HomeTransformation => item !== null);

  const attributedReviews: HomeReview[] = reviews
    .map((review) => {
      const trainer = trainersById.get(review.trainerId);
      return trainer
        ? {
            id: review.id,
            clientName: review.clientName,
            clientInitials: review.clientInitials,
            avatarColor: review.avatarColor,
            rating: review.rating,
            reviewText: review.reviewText,
            whenLabel: review.whenLabel,
            isVerified: review.isVerified,
            trainerName: trainer.name,
            trainerSlug: trainer.slug,
            trainerAvatarUrl: trainer.avatarUrl,
            trainerCity: trainer.city,
          }
        : null;
    })
    .filter((review): review is HomeReview => review !== null);

  const transformationsByTrainer = countBy(attributedTransformations, (item) => [
    item.trainerId,
  ]);

  const rankedTrainers = [...trainers].sort((a, b) => {
    const scoreDelta =
      proofScore(b, transformationsByTrainer[b.id] ?? 0) -
      proofScore(a, transformationsByTrainer[a.id] ?? 0);
    return scoreDelta !== 0 ? scoreDelta : a.sortRank - b.sortRank;
  });

  return {
    settings,
    numbers: computeNumbers(trainers, attributedReviews, attributedTransformations),
    featuredTrainers: applyFeaturedOrder(
      rankedTrainers,
      settings.featuredTrainerSlugs,
      (trainer) => trainer.slug,
    ),
    reviews: applyFeaturedOrder(
      attributedReviews,
      settings.featuredReviewIds,
      (review) => review.id,
    ),
    transformations: applyFeaturedOrder(
      attributedTransformations,
      settings.featuredTransformationIds,
      (item) => item.id,
    ),
    stories: applyFeaturedOrder(
      stories,
      settings.featuredStoryIds,
      (story) => story.id,
    ),
  };
});

/** Search categories that at least one published coach offers. */
export function liveCategories(numbers: HomeNumbers) {
  return searchCategories
    .map((category) => ({
      category,
      count: numbers.categoryCounts[category.id] ?? 0,
    }))
    .filter((entry) => entry.count > 0);
}
