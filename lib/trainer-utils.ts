import { SPORT_CATEGORY_ID, categoryLabels } from "@/lib/search-categories";
import type { Trainer, TrainerSort } from "@/lib/types";

export type TrainerQuery = {
  query?: string;
  city?: string;
  /** Coach-type category ids to include (union). Empty = all categories. */
  categories?: string[];
  /** Sport names to narrow Sports Coaches to. Only applies to the sport category. */
  sports?: string[];
  /** Free-text specialties (tags) to refine by. Independent of categories. */
  specialties?: string[];
  sort?: TrainerSort;
  limit?: number;
};

export function formatPriceInr(value: number | null) {
  if (value === null) {
    return "Free";
  }

  return `₹${value.toLocaleString("en-IN")}`;
}

/**
 * A trainer matches the category filter when they opted into at least one of
 * the selected categories. The sport category is special: if the client also
 * picked specific sports, the trainer must coach one of them. This keeps a
 * mixed selection intuitive — e.g. [gym, sport] + [cricket] means "gym trainers
 * OR cricket coaches", never "gym trainers who also coach cricket".
 */
function matchesCategories(
  trainer: Trainer,
  categories: string[],
  sports: string[],
) {
  if (categories.length === 0) {
    return true;
  }

  return categories.some((category) => {
    if (!trainer.categories.includes(category)) {
      return false;
    }
    if (category === SPORT_CATEGORY_ID && sports.length > 0) {
      return trainer.sports.some((sport) => sports.includes(sport));
    }
    return true;
  });
}

export function filterAndSortTrainers(
  trainers: Trainer[],
  options: TrainerQuery = {},
) {
  const search = options.query?.trim().toLowerCase();
  const city = options.city?.trim().toLowerCase();
  const categories = options.categories ?? [];
  const sports = options.sports ?? [];
  const specialties = options.specialties ?? [];

  let result = trainers.filter((trainer) => {
    if (city && trainer.city.trim().toLowerCase() !== city) {
      return false;
    }

    if (!matchesCategories(trainer, categories, sports)) {
      return false;
    }

    // Speciality is a decoupled refinement: it never follows from a category.
    if (
      specialties.length > 0 &&
      !specialties.some((spec) => trainer.tags.includes(spec))
    ) {
      return false;
    }

    if (search) {
      const searchable = [
        trainer.name,
        trainer.city,
        trainer.state,
        trainer.bio,
        ...trainer.tags,
        ...trainer.sports,
        ...categoryLabels(trainer.categories),
      ]
        .join(" ")
        .toLowerCase();

      if (!searchable.includes(search)) {
        return false;
      }
    }

    return true;
  });

  switch (options.sort) {
    case "rating":
      result = [...result].sort((a, b) => b.rating - a.rating);
      break;
    case "experience":
      result = [...result].sort(
        (a, b) => b.yearsExperience - a.yearsExperience,
      );
      break;
    case "price":
      result = [...result].sort((a, b) => a.priceFromInr - b.priceFromInr);
      break;
    default:
      result = [...result].sort((a, b) => a.sortRank - b.sortRank);
  }

  if (options.limit) {
    return result.slice(0, options.limit);
  }

  return result;
}
