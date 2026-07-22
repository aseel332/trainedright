import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { stateForCity } from "@/lib/search-categories";
import { parseVideoLink } from "@/lib/media-links";
import { draftPricingItems } from "@/lib/pricing";
import { createAdminSupabaseClient } from "@/lib/server/supabase-admin";
import {
  parseProfileDraft,
  type StoryMedia,
  type TrainerProfileDraft,
} from "@/lib/trainer-profile";

/**
 * Copies a trainer's self-serve profile (trainer_accounts.profile jsonb) into
 * the public `trainers` row + child tables the marketplace reads from.
 *
 * Runs with the service-role client, so it bypasses RLS and must only ever be
 * called from server code that has already authorised the caller.
 */

// Used only when a trainer published without their own imagery. The `trainers`
// image columns are NOT NULL, and these hosts are allowlisted in next.config.
const PLACEHOLDER_AVATAR =
  "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=72&w=128";
const PLACEHOLDER_COVER =
  "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=78&w=1200";

const AVATAR_COLORS = ["#F02D28", "#3B8CFF", "#A05CFF", "#1FCB6B"];

export type PublishResult = { ok: boolean; error?: string; slug?: string };

/** Matches the `slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'` check on public.trainers. */
export function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function initialsOf(name: string) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  return initials || "TR";
}

/** "2 weeks ago" style label for the public review cards. */
export function relativeWhen(value: string | null) {
  if (!value) {
    return "Recently";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);

  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "1 week ago";
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 60) return "1 month ago";
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.max(1, Math.floor(days / 365))} year ago`;
}

/**
 * wa.me needs a country code, but the profile form accepts a bare 10-digit
 * Indian mobile number. Returns "" when there is no usable number.
 */
export function normalizeWhatsapp(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length === 10) {
    return `91${digits}`;
  }

  return digits.length >= 11 ? digits : "";
}

function yearsOf(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 80) : 0;
}

function clientsOf(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 100000) : 0;
}

function priceFrom(profile: TrainerProfileDraft) {
  return profile.perSessionFee && profile.perSessionFee > 0
    ? Math.round(profile.perSessionFee)
    : 0;
}

type PublishedStoryMedia = {
  kind: "image" | "video";
  url: string;
  posterUrl: string;
};

/**
 * Resolve a draft story slot into what the public page renders: an uploaded
 * image URL, or a pasted video link turned into an embeddable URL + thumbnail.
 * Returns null for an empty or unusable slot.
 */
function publishStoryMedia(media: StoryMedia): PublishedStoryMedia | null {
  const url = media.url.trim();

  if (!url) {
    return null;
  }

  if (media.kind === "video") {
    const parsed = parseVideoLink(url);
    return parsed
      ? { kind: "video", url: parsed.embedUrl, posterUrl: parsed.thumbnailUrl }
      : null;
  }

  return /^https?:\/\//i.test(url) ? { kind: "image", url, posterUrl: "" } : null;
}

/** A short, single-line summary for the story card. */
function storyExcerpt(text: string) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > 200 ? `${clean.slice(0, 197).trimEnd()}…` : clean;
}

/**
 * A stable, unique slug. Keeps the slug a trainer already has, otherwise
 * derives one from their name and disambiguates collisions.
 */
async function resolveSlug(
  supabase: SupabaseClient,
  userId: string,
  name: string,
) {
  const { data: existing } = await supabase
    .from("trainers")
    .select("slug")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing?.slug) {
    return String(existing.slug);
  }

  const base = slugify(name) || `trainer-${userId.slice(0, 8)}`;

  for (let attempt = 0; attempt < 25; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const { data: taken } = await supabase
      .from("trainers")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (!taken) {
      return candidate;
    }
  }

  return `${base}-${userId.slice(0, 8)}`;
}

/** Publish (or re-publish) the account's profile to the public marketplace. */
export async function publishTrainerAccount(userId: string): Promise<PublishResult> {
  const supabase = createAdminSupabaseClient();

  if (!supabase) {
    return {
      ok: false,
      error: "SUPABASE_SERVICE_ROLE_KEY is not set, so publishing is disabled.",
    };
  }

  const { data: account, error: accountError } = await supabase
    .from("trainer_accounts")
    .select("profile, display_name")
    .eq("user_id", userId)
    .maybeSingle();

  if (accountError || !account) {
    return { ok: false, error: accountError?.message ?? "Trainer account not found." };
  }

  const profile = parseProfileDraft(account.profile);
  const name = profile.name.trim() || String(account.display_name ?? "").trim();

  if (!name) {
    return { ok: false, error: "This trainer has no name on their profile yet." };
  }

  // Every client contact goes through this number, so refuse to publish a
  // profile whose WhatsApp button would dial nowhere.
  const whatsapp = normalizeWhatsapp(profile.whatsapp);

  if (!whatsapp) {
    return {
      ok: false,
      error: "This trainer has no valid WhatsApp number on their profile yet.",
    };
  }

  const slug = await resolveSlug(supabase, userId, name);

  // Reviews and transformations the trainer has actually collected.
  const [reviewsResult, transformationsResult] = await Promise.all([
    supabase
      .from("review_requests")
      .select("*")
      .eq("trainer_user_id", userId)
      .eq("status", "submitted")
      .order("submitted_at", { ascending: false }),
    supabase
      .from("transformation_requests")
      .select("*")
      .eq("trainer_user_id", userId)
      .eq("status", "submitted")
      .order("submitted_at", { ascending: false }),
  ]);

  const reviews = reviewsResult.data ?? [];
  const transformations = transformationsResult.data ?? [];

  const ratings = reviews
    .map((row) => Number(row.rating))
    .filter((rating) => Number.isFinite(rating) && rating > 0);
  const rating =
    ratings.length > 0
      ? Math.round(
          (ratings.reduce((total, value) => total + value, 0) / ratings.length) * 10,
        ) / 10
      : 0;

  const topReview = [...reviews].sort(
    (a, b) => Number(b.rating ?? 0) - Number(a.rating ?? 0),
  )[0];
  const topReviewText = topReview ? String(topReview.review_text ?? "").trim() : "";

  // The coach chooses what their listing card quote shows: their own
  // description, or a top client review. "review" falls back to the
  // description until a review exists, so the card is never blank.
  const listingTestimonial =
    profile.listingBlurb === "review" && topReviewText
      ? topReviewText
      : profile.bio.trim();

  // The profile photo is what clients see on the listing card; the cover is
  // the wide shot behind the detail page hero. A trainer who never uploaded a
  // cover falls back to their profile photo there.
  const avatarUrl = profile.avatarUrl || PLACEHOLDER_AVATAR;
  const coverUrl = profile.coverUrl || profile.avatarUrl || PLACEHOLDER_COVER;

  const trainerRow = {
    user_id: userId,
    slug,
    name,
    first_name: name.split(/\s+/)[0] ?? name,
    // Never invent a location: a wrong city puts them in the wrong searches.
    city: profile.city,
    state: profile.state || stateForCity(profile.city),
    area: profile.area,
    bio: profile.bio,
    avatar_url: avatarUrl,
    // Listing card -> profile photo. Detail page hero -> cover.
    card_image_url: avatarUrl,
    hero_image_url: coverUrl,
    rating,
    review_count: reviews.length,
    years_experience: yearsOf(profile.yearsExperience),
    clients_count: clientsOf(profile.clientsCount),
    reply_time_label: "~24 hrs",
    price_from_inr: priceFrom(profile),
    whatsapp_number: whatsapp,
    instagram: profile.instagram.trim(),
    x: profile.x.trim(),
    youtube: profile.youtube.trim(),
    // The public listing filters by category through `specialties`, so that
    // column carries the raw category ids the trainer opted into. The trainer's
    // own free-text specialties stay searchable/displayed as `tags`.
    specialties: profile.searchCategories,
    // The specific sports a Sports Coach coaches (empty for everyone else).
    // Dropped + retried by upsertTrainerRow until the sports column migration
    // is applied.
    sports: profile.sports,
    tags: profile.specialties,
    badges: [] as string[],
    testimonial: listingTestimonial,
    is_active: true,
    sort_rank: 0,
  };

  // Drop any column the live schema doesn't have yet (e.g. state, socials
  // before their migration is applied), one per retry, so an unapplied
  // migration degrades gracefully instead of failing the whole publish.
  async function upsertTrainerRow(db: SupabaseClient) {
    const row: Record<string, unknown> = { ...trainerRow };
    for (let i = 0; i < 6; i += 1) {
      const result = await db
        .from("trainers")
        .upsert(row, { onConflict: "user_id" })
        .select("id, slug")
        .single();
      const missing = result.error?.message.match(
        /could not find the '([^']+)' column/i,
      );
      if (missing && missing[1] in row) {
        delete row[missing[1]];
        continue;
      }
      return result;
    }
    return db
      .from("trainers")
      .upsert(row, { onConflict: "user_id" })
      .select("id, slug")
      .single();
  }

  const { data: published, error: upsertError } = await upsertTrainerRow(supabase);

  if (upsertError || !published) {
    return { ok: false, error: upsertError?.message ?? "Could not publish the profile." };
  }

  const trainerId = String(published.id);

  // Child tables are a mirror of the profile, so replace rather than merge.
  await Promise.all([
    supabase.from("trainer_media").delete().eq("trainer_id", trainerId),
    supabase.from("trainer_pricing").delete().eq("trainer_id", trainerId),
    supabase.from("trainer_credentials").delete().eq("trainer_id", trainerId),
    supabase.from("trainer_reviews").delete().eq("trainer_id", trainerId),
    supabase.from("trainer_transformations").delete().eq("trainer_id", trainerId),
    supabase.from("stories").delete().eq("trainer_id", trainerId),
  ]);

  // Video links are converted to embeddable URLs + thumbnails and listed
  // first, so the trainer's intro video is the featured slot in the gallery.
  const videoRows = profile.videos
    .map((item) => parseVideoLink(item.url))
    .filter((parsed): parsed is NonNullable<typeof parsed> => parsed !== null)
    .map((parsed, index) => ({
      trainer_id: trainerId,
      media_type: "video" as const,
      url: parsed.embedUrl,
      poster_url: parsed.thumbnailUrl || null,
      sort_order: index + 1,
    }));

  const photoRows = profile.gallery
    .filter((item) => item.url)
    .map((item, index) => ({
      trainer_id: trainerId,
      media_type: "photo" as const,
      url: item.url,
      poster_url: null as string | null,
      sort_order: videoRows.length + index + 1,
    }));

  const mediaRows = [...videoRows, ...photoRows];

  const pricingRows = draftPricingItems(profile).map((item, index) => ({
    trainer_id: trainerId,
    name: item.name,
    description: item.description,
    price_inr: item.amount,
    unit: item.unit,
    badge: item.highlighted ? "START HERE" : null,
    sort_order: index + 1,
  }));

  const credentialRows = profile.credentials.map((credential, index) => ({
    trainer_id: trainerId,
    title: credential.title,
    subtitle: credential.issuedOn
      ? `Issued ${credential.issuedOn}`
      : "Document submitted",
    credential_type: "certified" as const,
    // Admin approved the account, but individual documents are not
    // independently checked, so don't claim a verified tick per credential.
    is_verified: false,
    sort_order: index + 1,
  }));

  const reviewRows = reviews.map((row, index) => {
    const clientName = String(row.client_name ?? "Client");
    return {
      trainer_id: trainerId,
      client_name: clientName,
      client_initials: initialsOf(clientName),
      avatar_color: AVATAR_COLORS[index % AVATAR_COLORS.length],
      rating: Number(row.rating ?? 0),
      review_text: String(row.review_text ?? ""),
      when_label: relativeWhen(row.submitted_at ? String(row.submitted_at) : null),
      // Only client-link submissions are verified; trainer-entered reviews
      // are consented but unverified.
      is_verified: row.source === "client_link",
      sort_order: index + 1,
    };
  });

  const transformationRows = transformations
    // Both images are NOT NULL on the public table, and a before/after card
    // makes no sense without them.
    .filter((row) => row.before_image_url && row.after_image_url)
    .map((row, index) => {
      const clientName = String(row.client_name ?? "Client");
      const rating = Number(row.rating);
      return {
        trainer_id: trainerId,
        result_label: String(row.result_label ?? "") || "Transformation",
        duration_label: String(row.duration_label ?? "") || "",
        before_image_url: String(row.before_image_url),
        after_image_url: String(row.after_image_url),
        client_name: clientName,
        client_initials: initialsOf(clientName),
        avatar_color: AVATAR_COLORS[index % AVATAR_COLORS.length],
        review: String(row.review_text ?? ""),
        rating: Number.isFinite(rating) && rating > 0 ? rating : null,
        is_confirmed: true,
        sort_order: index + 1,
      };
    });

  const storyRows = profile.stories
    // A titleless story is still a draft; don't publish it.
    .filter((story) => story.title.trim())
    .map((story, index) => {
      const cover = publishStoryMedia(story.cover);
      const sections = story.sections
        .map((section) => ({
          id: section.id,
          title: section.title,
          text: section.text,
          media: publishStoryMedia(section.media),
        }))
        // Drop sections with no heading, text, or usable media slot at all.
        .filter((section) => section.title.trim() || section.text.trim() || section.media);

      const sectionImage = sections.find(
        (section) => section.media?.kind === "image",
      )?.media?.url;

      // image_url is NOT NULL and drives the card thumbnail. Prefer the cover
      // image, then a cover video's thumbnail, then a section image, then the
      // trainer's avatar.
      const cardImage =
        (cover?.kind === "image" ? cover.url : "") ||
        cover?.posterUrl ||
        sectionImage ||
        avatarUrl;

      return {
        id: story.id,
        trainer_id: trainerId,
        title: story.title.trim(),
        author_name: name,
        excerpt: storyExcerpt(
          story.intro || sections[0]?.text || sections[0]?.title || "",
        ),
        image_url: cardImage,
        avatar_url: avatarUrl,
        is_featured: false,
        is_active: true,
        sort_order: index + 1,
        content: { intro: story.intro, cover, sections },
      };
    });

  async function insertStories(db: SupabaseClient) {
    if (storyRows.length === 0) {
      return null;
    }

    // Drop `content` and retry if the jsonb column isn't there yet, so the card
    // still publishes before the story-content migration is applied.
    const rows: Record<string, unknown>[] = storyRows.map((row) => ({ ...row }));
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const result = await db.from("stories").insert(rows);
      const missing = result.error?.message.match(
        /could not find the '([^']+)' column/i,
      );
      const column = missing?.[1];
      if (column && rows.every((row) => column in row)) {
        for (const row of rows) {
          delete row[column];
        }
        continue;
      }
      return result;
    }
    return db.from("stories").insert(rows);
  }

  async function insertTransformations(db: SupabaseClient) {
    if (transformationRows.length === 0) {
      return null;
    }

    const attempt = await db
      .from("trainer_transformations")
      .insert(transformationRows);

    // Until the 20260717 migration adds trainer_transformations.rating,
    // publish without it rather than failing the whole publish.
    if (attempt.error && /rating/i.test(attempt.error.message)) {
      return db.from("trainer_transformations").insert(
        transformationRows.map((row) => {
          const { rating, ...rest } = row;
          void rating;
          return rest;
        }),
      );
    }

    return attempt;
  }

  const inserts = await Promise.all([
    mediaRows.length ? supabase.from("trainer_media").insert(mediaRows) : null,
    pricingRows.length ? supabase.from("trainer_pricing").insert(pricingRows) : null,
    credentialRows.length
      ? supabase.from("trainer_credentials").insert(credentialRows)
      : null,
    reviewRows.length ? supabase.from("trainer_reviews").insert(reviewRows) : null,
    insertTransformations(supabase),
    insertStories(supabase),
  ]);

  const failed = inserts.find((result) => result?.error);
  if (failed?.error) {
    return { ok: false, error: failed.error.message };
  }

  return { ok: true, slug: String(published.slug) };
}

/** Hide a trainer from the public site without discarding their published row. */
export async function unpublishTrainerAccount(userId: string): Promise<PublishResult> {
  const supabase = createAdminSupabaseClient();

  if (!supabase) {
    return {
      ok: false,
      error: "SUPABASE_SERVICE_ROLE_KEY is not set, so publishing is disabled.",
    };
  }

  const { error } = await supabase
    .from("trainers")
    .update({ is_active: false })
    .eq("user_id", userId);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

/**
 * Push an approved trainer's latest profile straight to the public site.
 *
 * Approval is a standing decision, not a one-off: once admin approves someone,
 * their own saves go live immediately and no second admin step is needed.
 * Trainers who are not approved (draft, review, rejected) are left alone.
 */
export async function syncPublishedTrainer(
  userId: string,
): Promise<PublishResult | null> {
  const supabase = createAdminSupabaseClient();

  if (!supabase) {
    return null;
  }

  const { data: account } = await supabase
    .from("trainer_accounts")
    .select("approval_status")
    .eq("user_id", userId)
    .maybeSingle();

  if (account?.approval_status !== "approved") {
    return null;
  }

  return publishTrainerAccount(userId);
}