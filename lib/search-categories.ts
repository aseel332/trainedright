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
};

/** The id of the category whose selection reveals the sports picker. */
export const SPORT_CATEGORY_ID = "sport";

export const searchCategories: SearchCategory[] = [
  {
    id: "gym",
    label: "Gym Trainer",
    shortLabel: "Gym",
    description: "Strength, fat loss, muscle gain",
    tint: "#F02D28",
  },
  {
    id: SPORT_CATEGORY_ID,
    label: "Sports Coach",
    shortLabel: "Sports",
    description: "Cricket, football, tennis, athletics",
    tint: "#3B8CFF",
  },
  {
    id: "yoga",
    label: "Yoga / Aerobics / Zumba",
    shortLabel: "Yoga",
    description: "Flexibility, mobility, group energy",
    tint: "#A05CFF",
  },
  {
    id: "diet",
    label: "Nutritionist / Dietitian",
    shortLabel: "Nutrition",
    description: "Meal plans, weight management",
    tint: "#1FCB6B",
  },
];

export const cityOptions = [
  { name: "Mumbai", state: "Maharashtra", note: "820 coaches" },
  { name: "Delhi", state: "Delhi", note: "640 coaches" },
  { name: "Bengaluru", state: "Karnataka", note: "710 coaches" },
  { name: "Pune", state: "Maharashtra", note: "390 coaches" },
  { name: "Hyderabad", state: "Telangana", note: "410 coaches" },
  { name: "Chennai", state: "Tamil Nadu", note: "320 coaches" },
  { name: "Kolkata", state: "West Bengal", note: "280 coaches" },
  { name: "Ahmedabad", state: "Gujarat", note: "190 coaches" },
  { name: "Jaipur", state: "Rajasthan", note: "140 coaches" },
  { name: "Chandigarh", state: "Chandigarh", note: "120 coaches" },
];

/** The state a listed city sits in. Cities are a fixed set, so this is 1:1. */
export function stateForCity(cityName: string) {
  return cityOptions.find((option) => option.name === cityName)?.state ?? "";
}

export function categoryById(id: string) {
  return searchCategories.find((category) => category.id === id) ?? null;
}

/** Map category ids to their human labels (for search text + chips). */
export function categoryLabels(ids: string[]) {
  return ids
    .map((id) => categoryById(id)?.label)
    .filter((label): label is string => Boolean(label));
}

/**
 * Sports offered as quick-add suggestions while a Sports Coach types the sports
 * they coach. Trainers can add anything else by typing it — this is only a
 * starter set, and the marketplace's known sports are whatever trainers enter.
 */
export const sportSuggestions = [
  "Cricket",
  "Football",
  "Tennis",
  "Badminton",
  "Basketball",
  "Athletics",
  "Swimming",
  "Boxing",
  "MMA",
  "Table Tennis",
  "Hockey",
  "Volleyball",
  "Kabaddi",
  "Skating",
  "Cycling",
];

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
