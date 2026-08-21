/**
 * Editorial settings for the landing page.
 *
 * Everything factual on the home page — coach count, ratings, prices, reviews,
 * transformations — is read live from the marketplace tables and is never
 * stored here. This holds only what a human decides: the copy, which trainers
 * and which client proof to lead with, and which sections are on.
 *
 * Stored as jsonb in `site_settings.content` (id = 'home'). `parseHomeSettings`
 * fills in every missing field, so a row written by an older build — or a
 * completely absent table — still renders a correct page.
 *
 * Shared by the server (page + actions) and the admin editor, so this file must
 * stay free of server-only imports.
 */

export type HomeSectionId =
  | "coaches"
  | "proof"
  | "goals"
  | "cities"
  | "stories"
  | "trainerCta";

export type HomeSettings = {
  hero: {
    /** The H1. Supports the {city} token. */
    title: string;
    /** One short line under it. Supports {city}. Empty hides it. */
    subtitle: string;
  };
  coaches: { headline: string; body: string };
  proof: { headline: string; body: string };
  trainerCta: {
    headline: string;
    body: string;
    primaryLabel: string;
  };
  /** Ordered trainer slugs to lead with. Empty = automatic (best proof first). */
  featuredTrainerSlugs: string[];
  /** Ordered review ids to quote. Empty = automatic (verified, highest rated). */
  featuredReviewIds: string[];
  /** Ordered transformation ids to spotlight. Empty = automatic (confirmed). */
  featuredTransformationIds: string[];
  /** Ordered story ids. Empty = automatic (featured, then sort order). */
  featuredStoryIds: string[];
  /** Sections the landing page renders. A section with no data hides itself. */
  sections: Record<HomeSectionId, boolean>;
};

export const HOME_SECTIONS: { id: HomeSectionId; label: string; hint: string }[] =
  [
    {
      id: "coaches",
      label: "Coaches",
      hint: "Real published trainers, best proof first.",
    },
    {
      id: "proof",
      label: "Client proof",
      hint: "Before/after transformations and verified reviews.",
    },
    {
      id: "goals",
      label: "Browse by goal",
      hint: "Coach types, each with a live count.",
    },
    {
      id: "cities",
      label: "Cities",
      hint: "Live cities with real coach counts.",
    },
    { id: "stories", label: "Stories", hint: "Published long-form stories." },
    {
      id: "trainerCta",
      label: "For coaches",
      hint: "The sign-up panel at the bottom.",
    },
  ];

export const HOME_SETTINGS_ID = "home";

/**
 * Copy defaults.
 *
 * Kept deliberately short: the page's job is to show real coaches and real
 * client proof, and every extra sentence pushes those further down a phone
 * screen. Headings are plain statements of what the block is — the images and
 * the numbers do the persuading.
 */
export const defaultHomeSettings: HomeSettings = {
  hero: {
    // Deliberately not city-scoped: this is the front door for the whole site,
    // and naming one city makes it read as a local page. The section headings
    // below carry {city}, where the scope really is one city's listing.
    title: "Best trainers near you",
    subtitle: "Real client results, real prices, direct WhatsApp contact.",
  },
  coaches: {
    headline: "Coaches in {city}",
    body: "Verified before they go live. Nobody pays to rank.",
  },
  proof: {
    headline: "Real client results",
    body: "Submitted by the client, not the coach.",
  },
  trainerCta: {
    headline: "Get found by clients near you",
    body: "Free listing, 0% commission, and proof your clients submit themselves.",
    primaryLabel: "List your coaching",
  },
  featuredTrainerSlugs: [],
  featuredReviewIds: [],
  featuredTransformationIds: [],
  featuredStoryIds: [],
  sections: {
    coaches: true,
    proof: true,
    goals: true,
    cities: true,
    stories: true,
    trainerCta: true,
  },
};

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/** A trimmed string from the payload, or the default when absent/blank. */
function text(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

/**
 * Copy fields that are meaningfully optional (the hero chip) use this instead:
 * an explicit empty string is a real choice — "hide it" — not missing data.
 */
function optionalText(value: unknown, fallback: string) {
  return typeof value === "string" ? value.trim() : fallback;
}

function idList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set<string>();
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0 && !seen.has(item) && seen.add(item));
}

function flag(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

/**
 * Swap the {city} token for the city the marketplace actually has coaches in,
 * so a headline stays true as new cities open without anyone editing it.
 */
export function fillCity(value: string, city: string) {
  return value.replace(/\{city\}/gi, city || "your city");
}

export function parseHomeSettings(value: unknown): HomeSettings {
  const raw = record(value);
  const hero = record(raw.hero);
  const coaches = record(raw.coaches);
  const proof = record(raw.proof);
  const trainerCta = record(raw.trainerCta);
  const sections = record(raw.sections);
  const defaults = defaultHomeSettings;

  return {
    hero: {
      title: text(hero.title, defaults.hero.title),
      // Every body line is optional: clearing one is how you make the page
      // shorter, and a blank string has to survive the round trip to do that.
      subtitle: optionalText(hero.subtitle, defaults.hero.subtitle),
    },
    coaches: {
      headline: text(coaches.headline, defaults.coaches.headline),
      body: optionalText(coaches.body, defaults.coaches.body),
    },
    proof: {
      headline: text(proof.headline, defaults.proof.headline),
      body: optionalText(proof.body, defaults.proof.body),
    },
    trainerCta: {
      headline: text(trainerCta.headline, defaults.trainerCta.headline),
      body: optionalText(trainerCta.body, defaults.trainerCta.body),
      primaryLabel: text(
        trainerCta.primaryLabel,
        defaults.trainerCta.primaryLabel,
      ),
    },
    featuredTrainerSlugs: idList(raw.featuredTrainerSlugs),
    featuredReviewIds: idList(raw.featuredReviewIds),
    featuredTransformationIds: idList(raw.featuredTransformationIds),
    featuredStoryIds: idList(raw.featuredStoryIds),
    sections: {
      coaches: flag(sections.coaches, defaults.sections.coaches),
      proof: flag(sections.proof, defaults.sections.proof),
      goals: flag(sections.goals, defaults.sections.goals),
      cities: flag(sections.cities, defaults.sections.cities),
      stories: flag(sections.stories, defaults.sections.stories),
      trainerCta: flag(sections.trainerCta, defaults.sections.trainerCta),
    },
  };
}

/**
 * Order a list of records by an explicit id list, appending anything the list
 * does not mention. An empty pick means "automatic": keep the incoming order,
 * which every caller has already sorted by how strong the item is.
 */
export function applyFeaturedOrder<T>(
  items: T[],
  pickedIds: string[],
  idOf: (item: T) => string,
): T[] {
  if (pickedIds.length === 0) {
    return items;
  }

  const byId = new Map(items.map((item) => [idOf(item), item]));
  const picked = pickedIds
    .map((id) => byId.get(id))
    .filter((item): item is T => item !== undefined);
  const pickedSet = new Set(picked.map(idOf));

  return [...picked, ...items.filter((item) => !pickedSet.has(idOf(item)))];
}
