import { cityOptions, searchCategories } from "@/lib/search-categories";

/**
 * Programmatic SEO landing pages: one profession per high-intent search
 * phrase ("personal trainer in mumbai", "dietitian near me"), each crossed
 * with the fixed city list. `categoryIds` maps a page onto the listing
 * taxonomy; an empty list means "every coach type".
 */
export type SeoProfession = {
  /** URL segment, e.g. "personal-trainers". */
  slug: string;
  /** Search-category ids this page filters by. Empty = all categories. */
  categoryIds: string[];
  /** Lowercase singular used mid-sentence: "a personal trainer". */
  singular: string;
  /** Title-case plural used in H1s and titles: "Personal Trainers". */
  plural: string;
  /** What this coach type helps with — woven into intro copy. */
  helpsWith: string;
  /** Alternate phrases people search for; mentioned in copy to rank variants. */
  alsoKnownAs: string[];
};

export const seoProfessions: SeoProfession[] = [
  {
    slug: "fitness-trainers",
    categoryIds: [],
    singular: "fitness trainer",
    plural: "Fitness Trainers",
    helpsWith:
      "weight loss, strength, a healthier lifestyle and sport-specific goals",
    alsoKnownAs: ["fitness coaches", "workout trainers"],
  },
  {
    slug: "personal-trainers",
    categoryIds: ["gym"],
    singular: "personal trainer",
    plural: "Personal Trainers",
    helpsWith: "strength, fat loss and muscle gain in the gym",
    alsoKnownAs: ["gym trainers", "strength coaches"],
  },
  {
    slug: "sports-coaches",
    categoryIds: ["sport"],
    singular: "sports coach",
    plural: "Sports Coaches",
    helpsWith: "cricket, football, tennis, badminton, athletics and more",
    alsoKnownAs: ["cricket coaches", "football coaches", "athletics coaches"],
  },
  {
    slug: "yoga-instructors",
    categoryIds: ["yoga"],
    singular: "yoga instructor",
    plural: "Yoga & Zumba Instructors",
    helpsWith: "flexibility, mobility, aerobics and group energy",
    alsoKnownAs: ["yoga trainers", "zumba instructors", "aerobics coaches"],
  },
  {
    slug: "dietitians",
    categoryIds: ["diet"],
    singular: "dietitian",
    plural: "Dietitians & Nutritionists",
    helpsWith: "meal plans, weight management and sustainable nutrition",
    alsoKnownAs: ["nutritionists", "diet coaches"],
  },
];

export function professionBySlug(slug: string) {
  return seoProfessions.find((profession) => profession.slug === slug) ?? null;
}

/** All listed city names are single words, so the slug is just lowercase. */
export function citySlugOf(cityName: string) {
  return cityName.toLowerCase();
}

export function cityBySlug(slug: string) {
  return cityOptions.find((city) => citySlugOf(city.name) === slug) ?? null;
}

/** The equivalent interactive search URL for a landing page. */
export function searchHrefFor(profession: SeoProfession, cityName?: string) {
  const params = new URLSearchParams();
  if (cityName) {
    params.set("city", cityName);
  }
  if (profession.categoryIds.length > 0) {
    params.set("cat", profession.categoryIds.join(","));
  }
  const query = params.toString();
  return query ? `/trainers?${query}` : "/trainers";
}

/** Human label for a trainer's primary coach type ("Gym Trainer"). */
export function primaryCategoryLabel(categoryIds: string[]) {
  const first = searchCategories.find((category) =>
    categoryIds.includes(category.id),
  );
  return first?.label ?? "Fitness Trainer";
}
