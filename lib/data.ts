import {
  buildFallbackProfile,
  buildFallbackProfileFromTrainer,
  fallbackStories,
  fallbackTrainers,
} from "@/lib/fallback-data";
import { createClient } from "@/lib/supabase";
import { connection } from "next/server";
import { filterAndSortTrainers } from "@/lib/trainer-utils";
import type {
  PricingOption,
  Story,
  Trainer,
  TrainerBadge,
  TrainerCredential,
  TrainerLocation,
  TrainerMedia,
  TrainerProfile,
  TrainerReview,
  Transformation,
} from "@/lib/types";

type TrainerQuery = {
  query?: string;
  specs?: string[];
  verified?: boolean;
  maxPrice?: number;
  sort?: "recommended" | "rating" | "experience" | "price";
  limit?: number;
};

type TrainerRow = {
  id: string;
  slug: string;
  name: string;
  first_name: string;
  city: string;
  area: string;
  bio: string;
  avatar_url: string;
  card_image_url: string;
  hero_image_url: string;
  rating: number;
  review_count: number;
  years_experience: number;
  clients_count: number;
  reply_time_label: string;
  price_from_inr: number;
  specialties: string[] | null;
  tags: string[] | null;
  badges: string[] | null;
  testimonial: string;
  is_verified: boolean;
  sort_rank: number;
};

type StoryRow = {
  id: string;
  trainer_id: string | null;
  title: string;
  author_name: string;
  excerpt: string;
  image_url: string;
  avatar_url: string;
  is_featured: boolean;
  sort_order: number;
};

type MediaRow = {
  id: string;
  trainer_id: string;
  media_type: "photo" | "video";
  url: string;
  poster_url: string | null;
  sort_order: number;
};

type PricingRow = {
  id: string;
  trainer_id: string;
  name: string;
  description: string;
  price_inr: number | null;
  unit: string;
  badge: string | null;
  sort_order: number;
};

type TransformationRow = {
  id: string;
  trainer_id: string;
  result_label: string;
  duration_label: string;
  before_image_url: string;
  after_image_url: string;
  client_name: string;
  client_initials: string;
  avatar_color: string;
  review: string;
  is_confirmed: boolean;
  sort_order: number;
};

type ReviewRow = {
  id: string;
  trainer_id: string;
  client_name: string;
  client_initials: string;
  avatar_color: string;
  rating: number;
  review_text: string;
  when_label: string;
  is_verified: boolean;
  sort_order: number;
};

type LocationRow = {
  id: string;
  trainer_id: string;
  name: string;
  area: string;
  sort_order: number;
};

type CredentialRow = {
  id: string;
  trainer_id: string;
  title: string;
  subtitle: string;
  credential_type: "certified" | "id" | "medical" | "award";
  is_verified: boolean;
  sort_order: number;
};

const badgeValues = new Set<TrainerBadge>(["award", "verified", "loved"]);

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function badgeArray(value: unknown): TrainerBadge[] {
  return stringArray(value).filter((item): item is TrainerBadge =>
    badgeValues.has(item as TrainerBadge),
  );
}

function mapTrainer(row: TrainerRow): Trainer {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    firstName: row.first_name,
    city: row.city,
    area: row.area,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    cardImageUrl: row.card_image_url,
    heroImageUrl: row.hero_image_url,
    rating: Number(row.rating),
    reviewCount: row.review_count,
    yearsExperience: row.years_experience,
    clientsCount: row.clients_count,
    replyTimeLabel: row.reply_time_label,
    priceFromInr: row.price_from_inr,
    specialties: stringArray(row.specialties),
    tags: stringArray(row.tags),
    badges: badgeArray(row.badges),
    testimonial: row.testimonial,
    isVerified: row.is_verified,
    sortRank: row.sort_rank,
  };
}

function mapStory(row: StoryRow): Story {
  return {
    id: row.id,
    trainerId: row.trainer_id,
    title: row.title,
    authorName: row.author_name,
    excerpt: row.excerpt,
    imageUrl: row.image_url,
    avatarUrl: row.avatar_url,
    isFeatured: row.is_featured,
    sortOrder: row.sort_order,
  };
}

function mapMedia(row: MediaRow): TrainerMedia {
  return {
    id: row.id,
    trainerId: row.trainer_id,
    type: row.media_type,
    url: row.url,
    posterUrl: row.poster_url,
    sortOrder: row.sort_order,
  };
}

function mapPricing(row: PricingRow): PricingOption {
  return {
    id: row.id,
    trainerId: row.trainer_id,
    name: row.name,
    description: row.description,
    priceInr: row.price_inr,
    unit: row.unit,
    badge: row.badge,
    sortOrder: row.sort_order,
  };
}

function mapTransformation(row: TransformationRow): Transformation {
  return {
    id: row.id,
    trainerId: row.trainer_id,
    resultLabel: row.result_label,
    durationLabel: row.duration_label,
    beforeImageUrl: row.before_image_url,
    afterImageUrl: row.after_image_url,
    clientName: row.client_name,
    clientInitials: row.client_initials,
    avatarColor: row.avatar_color,
    review: row.review,
    isConfirmed: row.is_confirmed,
    sortOrder: row.sort_order,
  };
}

function mapReview(row: ReviewRow): TrainerReview {
  return {
    id: row.id,
    trainerId: row.trainer_id,
    clientName: row.client_name,
    clientInitials: row.client_initials,
    avatarColor: row.avatar_color,
    rating: Number(row.rating),
    reviewText: row.review_text,
    whenLabel: row.when_label,
    isVerified: row.is_verified,
    sortOrder: row.sort_order,
  };
}

function mapLocation(row: LocationRow): TrainerLocation {
  return {
    id: row.id,
    trainerId: row.trainer_id,
    name: row.name,
    area: row.area,
    sortOrder: row.sort_order,
  };
}

function mapCredential(row: CredentialRow): TrainerCredential {
  return {
    id: row.id,
    trainerId: row.trainer_id,
    title: row.title,
    subtitle: row.subtitle,
    credentialType: row.credential_type,
    isVerified: row.is_verified,
    sortOrder: row.sort_order,
  };
}

async function fetchTrainersFromSupabase() {
  const supabase = createClient();

  if (!supabase) {
    return null;
  }

  await connection();

  const { data, error } = await supabase
    .from("trainers")
    .select("*")
    .eq("is_active", true)
    .order("sort_rank", { ascending: true });

  if (error || !data) {
    return null;
  }

  return (data as TrainerRow[]).map(mapTrainer);
}

export async function getTrainers(options: TrainerQuery = {}) {
  const trainers = (await fetchTrainersFromSupabase()) ?? fallbackTrainers;
  return filterAndSortTrainers(trainers, options);
}

export async function getFeaturedStories() {
  const supabase = createClient();

  if (!supabase) {
    return fallbackStories;
  }

  await connection();

  const { data, error } = await supabase
    .from("stories")
    .select("*")
    .eq("is_active", true)
    .eq("is_featured", true)
    .order("sort_order", { ascending: true })
    .limit(6);

  if (error || !data || data.length === 0) {
    return fallbackStories;
  }

  return (data as StoryRow[]).map(mapStory);
}

async function fetchProfileChildren(trainerId: string) {
  const supabase = createClient();

  if (!supabase) {
    return null;
  }

  const [
    media,
    pricing,
    transformations,
    stories,
    reviews,
    locations,
    credentials,
  ] = await Promise.all([
    supabase
      .from("trainer_media")
      .select("*")
      .eq("trainer_id", trainerId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("trainer_pricing")
      .select("*")
      .eq("trainer_id", trainerId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("trainer_transformations")
      .select("*")
      .eq("trainer_id", trainerId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("stories")
      .select("*")
      .eq("trainer_id", trainerId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("trainer_reviews")
      .select("*")
      .eq("trainer_id", trainerId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("trainer_locations")
      .select("*")
      .eq("trainer_id", trainerId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("trainer_credentials")
      .select("*")
      .eq("trainer_id", trainerId)
      .order("sort_order", { ascending: true }),
  ]);

  if (
    media.error ||
    pricing.error ||
    transformations.error ||
    stories.error ||
    reviews.error ||
    locations.error ||
    credentials.error
  ) {
    return null;
  }

  return {
    media: ((media.data ?? []) as MediaRow[]).map(mapMedia),
    pricing: ((pricing.data ?? []) as PricingRow[]).map(mapPricing),
    transformations: (
      (transformations.data ?? []) as TransformationRow[]
    ).map(mapTransformation),
    stories: ((stories.data ?? []) as StoryRow[]).map(mapStory),
    reviews: ((reviews.data ?? []) as ReviewRow[]).map(mapReview),
    locations: ((locations.data ?? []) as LocationRow[]).map(mapLocation),
    credentials: ((credentials.data ?? []) as CredentialRow[]).map(
      mapCredential,
    ),
  };
}

function withProfileFallback(
  trainer: Trainer,
  partial: Omit<TrainerProfile, keyof Trainer>,
): TrainerProfile {
  const knownSeedProfile =
    buildFallbackProfile(trainer.slug) ?? buildFallbackProfileFromTrainer(trainer);

  return {
    ...trainer,
    media: partial.media.length > 0 ? partial.media : knownSeedProfile.media,
    pricing:
      partial.pricing.length > 0 ? partial.pricing : knownSeedProfile.pricing,
    transformations:
      partial.transformations.length > 0
        ? partial.transformations
        : knownSeedProfile.transformations,
    stories: partial.stories.length > 0 ? partial.stories : knownSeedProfile.stories,
    reviews:
      partial.reviews.length > 0 ? partial.reviews : knownSeedProfile.reviews,
    locations:
      partial.locations.length > 0 ? partial.locations : knownSeedProfile.locations,
    credentials:
      partial.credentials.length > 0
        ? partial.credentials
        : knownSeedProfile.credentials,
  };
}

export async function getTrainerProfile(slug: string) {
  const supabase = createClient();

  if (!supabase) {
    return buildFallbackProfile(slug);
  }

  await connection();

  const { data, error } = await supabase
    .from("trainers")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    return buildFallbackProfile(slug);
  }

  const trainer = mapTrainer(data as TrainerRow);
  const children = await fetchProfileChildren(trainer.id);

  if (!children) {
    return buildFallbackProfile(trainer.slug) ?? null;
  }

  return withProfileFallback(trainer, children);
}
