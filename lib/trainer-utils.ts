import type { Trainer, TrainerSort } from "@/lib/types";

type TrainerQuery = {
  query?: string;
  city?: string;
  specs?: string[];
  verified?: boolean;
  maxPrice?: number;
  sort?: TrainerSort;
  limit?: number;
};

export function formatPriceInr(value: number | null) {
  if (value === null) {
    return "Free";
  }

  return `₹${value.toLocaleString("en-IN")}`;
}

export function filterAndSortTrainers(
  trainers: Trainer[],
  options: TrainerQuery = {},
) {
  const search = options.query?.trim().toLowerCase();
  const city = options.city?.trim().toLowerCase();
  const specs = options.specs ?? [];
  const maxPrice = options.maxPrice ?? 0;

  let result = trainers.filter((trainer) => {
    if (city && trainer.city.trim().toLowerCase() !== city) {
      return false;
    }

    const searchable = [
      trainer.name,
      trainer.city,
      trainer.state,
      trainer.bio,
      ...trainer.specialties,
      ...trainer.tags,
    ]
      .join(" ")
      .toLowerCase();

    if (search && !searchable.includes(search)) {
      return false;
    }

    if (options.verified && !trainer.isVerified) {
      return false;
    }

    if (
      specs.length > 0 &&
      !specs.some((spec) => trainer.specialties.includes(spec))
    ) {
      return false;
    }

    if (maxPrice > 0 && trainer.priceFromInr > maxPrice) {
      return false;
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
