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
    /** Small chip above the headline. Empty hides the chip. */
    eyebrow: string;
    /** First line of the H1, rendered in white. */
    titleLead: string;
    /** Second line of the H1, rendered in the accent colour. */
    titleAccent: string;
    /** Sentence under the headline. */
    subtitle: string;
  };
  coaches: { headline: string; body: string };
  proof: { headline: string; body: string };
  trainerCta: {
    eyebrow: string;
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
 * Defaults are written against what TrainedRight actually is — a small,
 * Ahmedabad-first marketplace where every coach is reviewed by a human and
 * every review comes from a real client — rather than generic fitness copy.
 */
export const defaultHomeSettings: HomeSettings = {
  hero: {
    eyebrow: "Checked before they go live",
    titleLead: "Don't gamble on",
    titleAccent: "your trainer.",
    subtitle:
      "See who actually coaches near you — their real clients, real results and real prices — then message them directly on WhatsApp. No fees, no middlemen, no ads dressed up as recommendations.",
  },
  coaches: {
    headline: "The coaches, not a shortlist we were paid for.",
    body: "Every profile here belongs to a working coach who was verified before going live. Nobody pays to rank.",
  },
  proof: {
    headline: "Proof you can check.",
    body: "Transformations and reviews are submitted by the client themselves through a private link — the coach never types them.",
  },
  trainerCta: {
    eyebrow: "For coaches",
    headline: "Your next client is already searching your city.",
    body: "Build a profile that does the selling, collect reviews and transformations your clients submit themselves, and see exactly who found you. You keep the client and 100% of what you charge.",
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
      eyebrow: optionalText(hero.eyebrow, defaults.hero.eyebrow),
      titleLead: text(hero.titleLead, defaults.hero.titleLead),
      titleAccent: text(hero.titleAccent, defaults.hero.titleAccent),
      subtitle: text(hero.subtitle, defaults.hero.subtitle),
    },
    coaches: {
      headline: text(coaches.headline, defaults.coaches.headline),
      body: text(coaches.body, defaults.coaches.body),
    },
    proof: {
      headline: text(proof.headline, defaults.proof.headline),
      body: text(proof.body, defaults.proof.body),
    },
    trainerCta: {
      eyebrow: text(trainerCta.eyebrow, defaults.trainerCta.eyebrow),
      headline: text(trainerCta.headline, defaults.trainerCta.headline),
      body: text(trainerCta.body, defaults.trainerCta.body),
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
