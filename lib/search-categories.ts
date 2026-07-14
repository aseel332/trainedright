/**
 * Search categories are the fixed taxonomy clients browse by.
 * They are intentionally separate from specialties, which are free-text
 * labels each trainer writes themselves (max 4).
 */
export type SearchCategory = {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  tint: string;
  /** Seed-data specialties this category maps onto for legacy filtering. */
  specs: string[];
};

export const searchCategories: SearchCategory[] = [
  {
    id: "gym",
    label: "Gym Trainer",
    shortLabel: "Gym",
    description: "Strength, fat loss, muscle gain",
    tint: "#F02D28",
    specs: ["Strength", "Weight loss"],
  },
  {
    id: "sport",
    label: "Sports Coach",
    shortLabel: "Sports",
    description: "Cricket, football, tennis, athletics",
    tint: "#3B8CFF",
    specs: ["Sports", "Boxing"],
  },
  {
    id: "yoga",
    label: "Yoga / Aerobics / Zumba",
    shortLabel: "Yoga",
    description: "Flexibility, mobility, group energy",
    tint: "#A05CFF",
    specs: ["Yoga"],
  },
  {
    id: "diet",
    label: "Nutritionist / Dietitian",
    shortLabel: "Nutrition",
    description: "Meal plans, weight management",
    tint: "#1FCB6B",
    specs: ["Nutrition", "Weight loss"],
  },
];

export const cityOptions = [
  { name: "Mumbai", note: "820 coaches" },
  { name: "Delhi", note: "640 coaches" },
  { name: "Bengaluru", note: "710 coaches" },
  { name: "Pune", note: "390 coaches" },
  { name: "Hyderabad", note: "410 coaches" },
  { name: "Chennai", note: "320 coaches" },
  { name: "Kolkata", note: "280 coaches" },
  { name: "Ahmedabad", note: "190 coaches" },
  { name: "Jaipur", note: "140 coaches" },
  { name: "Chandigarh", note: "120 coaches" },
];

export function categoryById(id: string) {
  return searchCategories.find((category) => category.id === id) ?? null;
}

export function categoryIdsToSpecs(ids: string[]) {
  return Array.from(
    new Set(
      searchCategories
        .filter((category) => ids.includes(category.id))
        .flatMap((category) => category.specs),
    ),
  );
}

/** Suggestions offered while a trainer types their own specialties. */
export const specialtySuggestions = [
  "Strength",
  "Weight loss",
  "Hypertrophy",
  "Powerlifting",
  "Yoga",
  "Mobility",
  "Boxing",
  "Kickboxing",
  "Cricket",
  "Football",
  "Running",
  "Nutrition",
  "Meal planning",
  "Pre/post-natal",
  "Rehab",
  "Calisthenics",
  "CrossFit",
  "Zumba",
];
