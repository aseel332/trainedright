import { stateForCity } from "@/lib/search-categories";

export const MAX_SPECIALTIES = 4;

export type ProfilePlan = {
  id: string;
  name: string;
  description: string;
  price: number | null;
  unit: string;
  badge: string;
};

export type ProfileCredential = {
  id: string;
  title: string;
  issuedOn: string;
  fileUrl: string;
  fileType: "image" | "pdf" | "";
};

export type ProfileMediaItem = {
  id: string;
  url: string;
  name: string;
};

/** A pasted video link (Google Drive / YouTube / direct file). */
export type ProfileVideoItem = {
  id: string;
  url: string;
};

export type StoryMediaKind = "image" | "video";

/**
 * One image or video slot in a story. Images are uploaded (a storage URL);
 * videos are pasted Google Drive / YouTube / direct-file links (kept raw, like
 * the gallery videos, and turned into embeddable URLs only at publish time).
 * An empty `url` means the slot has no media yet.
 */
export type StoryMedia = {
  kind: StoryMediaKind;
  url: string;
};

/** One section of a story: a block of text with an optional image or video. */
export type ProfileStorySection = {
  id: string;
  media: StoryMedia;
  text: string;
};

/** A trainer-authored article: title, intro, a cover, and ordered sections. */
export type ProfileStory = {
  id: string;
  title: string;
  intro: string;
  cover: StoryMedia;
  sections: ProfileStorySection[];
};

export function emptyStoryMedia(): StoryMedia {
  return { kind: "image", url: "" };
}

export function emptyStory(): ProfileStory {
  return {
    id: crypto.randomUUID(),
    title: "",
    intro: "",
    cover: emptyStoryMedia(),
    sections: [],
  };
}

export function emptyStorySection(): ProfileStorySection {
  return { id: crypto.randomUUID(), media: emptyStoryMedia(), text: "" };
}

/** What the listing card's quote line shows. */
export type ListingBlurb = "description" | "review";

export type TrainerProfileDraft = {
  name: string;
  headline: string;
  bio: string;
  city: string;
  state: string;
  area: string;
  whatsapp: string;
  instagram: string;
  x: string;
  youtube: string;
  yearsExperience: string;
  clientsCount: string;
  /** The membership plan chosen at go-live (see lib/subscription-plans). */
  subscriptionPlan: string;
  specialties: string[];
  searchCategories: string[];
  avatarUrl: string;
  coverUrl: string;
  /** Whether the listing card highlights the bio or a top client review. */
  listingBlurb: ListingBlurb;
  gallery: ProfileMediaItem[];
  videos: ProfileVideoItem[];
  plans: ProfilePlan[];
  credentials: ProfileCredential[];
  stories: ProfileStory[];
};

export const emptyProfile: TrainerProfileDraft = {
  name: "",
  headline: "",
  bio: "",
  city: "",
  state: "",
  area: "",
  whatsapp: "",
  instagram: "",
  x: "",
  youtube: "",
  yearsExperience: "",
  clientsCount: "",
  subscriptionPlan: "",
  specialties: [],
  searchCategories: [],
  avatarUrl: "",
  coverUrl: "",
  listingBlurb: "description",
  gallery: [],
  videos: [],
  plans: [],
  credentials: [],
  stories: [],
};

function stringOf(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function stringArrayOf(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function galleryOf(value: unknown): ProfileMediaItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null,
    )
    .map((item) => ({
      id: stringOf(item.id) || crypto.randomUUID(),
      url: stringOf(item.url),
      name: stringOf(item.name),
    }))
    .filter((item) => item.url.length > 0);
}

function videosOf(value: unknown): ProfileVideoItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null,
    )
    .map((item) => ({
      id: stringOf(item.id) || crypto.randomUUID(),
      url: stringOf(item.url),
    }))
    .filter((item) => item.url.length > 0);
}

function storyMediaOf(value: unknown): StoryMedia {
  if (typeof value !== "object" || value === null) {
    return emptyStoryMedia();
  }

  const raw = value as Record<string, unknown>;
  return {
    kind: raw.kind === "video" ? "video" : "image",
    url: stringOf(raw.url),
  };
}

function storySectionsOf(value: unknown): ProfileStorySection[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null,
    )
    .map((item) => ({
      id: stringOf(item.id) || crypto.randomUUID(),
      media: storyMediaOf(item.media),
      text: stringOf(item.text),
    }));
}

function storiesOf(value: unknown): ProfileStory[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null,
    )
    .map((item) => ({
      id: stringOf(item.id) || crypto.randomUUID(),
      title: stringOf(item.title),
      intro: stringOf(item.intro),
      cover: storyMediaOf(item.cover),
      sections: storySectionsOf(item.sections),
    }));
}

function plansOf(value: unknown): ProfilePlan[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null,
    )
    .map((item) => ({
      id: stringOf(item.id) || crypto.randomUUID(),
      name: stringOf(item.name),
      description: stringOf(item.description),
      price:
        typeof item.price === "number" && Number.isFinite(item.price)
          ? item.price
          : null,
      unit: stringOf(item.unit),
      badge: stringOf(item.badge),
    }))
    .filter((item) => item.name.length > 0);
}

function credentialsOf(value: unknown): ProfileCredential[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null,
    )
    .map((item): ProfileCredential => ({
      id: stringOf(item.id) || crypto.randomUUID(),
      title: stringOf(item.title),
      issuedOn: stringOf(item.issuedOn),
      fileUrl: stringOf(item.fileUrl),
      fileType:
        item.fileType === "image" || item.fileType === "pdf"
          ? item.fileType
          : "",
    }))
    .filter((item) => item.title.length > 0);
}

/** Parse an untrusted jsonb payload into a well-formed profile draft. */
export function parseProfileDraft(value: unknown): TrainerProfileDraft {
  if (typeof value !== "object" || value === null) {
    return { ...emptyProfile };
  }

  const raw = value as Record<string, unknown>;

  return {
    name: stringOf(raw.name),
    headline: stringOf(raw.headline),
    bio: stringOf(raw.bio),
    city: stringOf(raw.city),
    // Older drafts predate `state`; fall back to the city's state.
    state: stringOf(raw.state) || stateForCity(stringOf(raw.city)),
    area: stringOf(raw.area),
    whatsapp: stringOf(raw.whatsapp),
    instagram: stringOf(raw.instagram),
    x: stringOf(raw.x),
    youtube: stringOf(raw.youtube),
    yearsExperience: stringOf(raw.yearsExperience),
    clientsCount: stringOf(raw.clientsCount),
    subscriptionPlan: stringOf(raw.subscriptionPlan),
    specialties: stringArrayOf(raw.specialties).slice(0, MAX_SPECIALTIES),
    searchCategories: stringArrayOf(raw.searchCategories),
    avatarUrl: stringOf(raw.avatarUrl),
    coverUrl: stringOf(raw.coverUrl),
    listingBlurb: raw.listingBlurb === "review" ? "review" : "description",
    gallery: galleryOf(raw.gallery),
    videos: videosOf(raw.videos),
    plans: plansOf(raw.plans),
    credentials: credentialsOf(raw.credentials),
    stories: storiesOf(raw.stories),
  };
}

/**
 * A URL safe to persist to the database. Uploads that fail (no storage
 * configured, or a network error) fall back to a tab-local `blob:` object URL
 * which is meaningless anywhere else — those must never reach the DB or they
 * publish as permanently broken images.
 */
export function isStorableUrl(url: string): boolean {
  return /^https?:\/\//i.test(url.trim());
}

/**
 * Drop any image URL that isn't safe to store (blob:/data: previews from a
 * failed upload). Applied server-side on save so a stranded preview never gets
 * written to trainer_accounts.profile or published to the public tables.
 */
export function stripUnstorableImages(
  profile: TrainerProfileDraft,
): TrainerProfileDraft {
  const keepUrl = (url: string) => (isStorableUrl(url) ? url : "");

  // An uploaded image that failed leaves a blob: preview; drop it. A video slot
  // holds a pasted link (never a storage upload), so leave it untouched — it is
  // validated at publish.
  const keepMedia = (media: StoryMedia): StoryMedia =>
    media.kind === "image" && !isStorableUrl(media.url)
      ? { ...media, url: "" }
      : media;

  return {
    ...profile,
    avatarUrl: keepUrl(profile.avatarUrl),
    coverUrl: keepUrl(profile.coverUrl),
    gallery: profile.gallery.filter((item) => isStorableUrl(item.url)),
    credentials: profile.credentials.map((credential) => ({
      ...credential,
      fileUrl: keepUrl(credential.fileUrl),
      fileType: isStorableUrl(credential.fileUrl) ? credential.fileType : "",
    })),
    stories: profile.stories.map((story) => ({
      ...story,
      cover: keepMedia(story.cover),
      sections: story.sections.map((section) => ({
        ...section,
        media: keepMedia(section.media),
      })),
    })),
  };
}

export type ProfileRequirement = {
  id: string;
  label: string;
  done: boolean;
};

/** The short list a profile needs before it can go live. */
export function profileRequirements(
  profile: TrainerProfileDraft,
): ProfileRequirement[] {
  return [
    {
      id: "name",
      label: "Your name",
      done: profile.name.trim().length > 1,
    },
    {
      id: "categories",
      label: "At least one search category",
      done: profile.searchCategories.length > 0,
    },
    {
      id: "specialties",
      label: "At least one specialty",
      done: profile.specialties.length > 0,
    },
    {
      id: "bio",
      label: "A bio of 80+ characters",
      done: profile.bio.trim().length >= 80,
    },
    {
      id: "whatsapp",
      label: "WhatsApp number",
      done: profile.whatsapp.replace(/\D/g, "").length >= 10,
    },
  ];
}

export function profileIsSubmittable(profile: TrainerProfileDraft) {
  return profileRequirements(profile).every((item) => item.done);
}

/** The "from" price shown on cards — the cheapest paid plan, or 0 if none. */
export function profilePriceFromInr(profile: TrainerProfileDraft) {
  const prices = profile.plans
    .map((plan) => plan.price)
    .filter((price): price is number => typeof price === "number" && price > 0);
  return prices.length > 0 ? Math.round(Math.min(...prices)) : 0;
}

export function profileCompletionPercent(profile: TrainerProfileDraft) {
  const checks = [
    ...profileRequirements(profile).map((item) => item.done),
    Boolean(profile.avatarUrl),
    Boolean(profile.coverUrl),
    profile.gallery.length > 0,
    profile.plans.length > 0,
    profile.credentials.length > 0,
    Boolean(profile.city),
  ];
  return Math.round(
    (checks.filter(Boolean).length / checks.length) * 100,
  );
}
