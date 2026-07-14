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

export type TrainerProfileDraft = {
  name: string;
  headline: string;
  bio: string;
  city: string;
  area: string;
  whatsapp: string;
  yearsExperience: string;
  specialties: string[];
  searchCategories: string[];
  avatarUrl: string;
  coverUrl: string;
  gallery: ProfileMediaItem[];
  plans: ProfilePlan[];
  credentials: ProfileCredential[];
};

export const emptyProfile: TrainerProfileDraft = {
  name: "",
  headline: "",
  bio: "",
  city: "",
  area: "",
  whatsapp: "",
  yearsExperience: "",
  specialties: [],
  searchCategories: [],
  avatarUrl: "",
  coverUrl: "",
  gallery: [],
  plans: [],
  credentials: [],
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
    area: stringOf(raw.area),
    whatsapp: stringOf(raw.whatsapp),
    yearsExperience: stringOf(raw.yearsExperience),
    specialties: stringArrayOf(raw.specialties).slice(0, MAX_SPECIALTIES),
    searchCategories: stringArrayOf(raw.searchCategories),
    avatarUrl: stringOf(raw.avatarUrl),
    coverUrl: stringOf(raw.coverUrl),
    gallery: galleryOf(raw.gallery),
    plans: plansOf(raw.plans),
    credentials: credentialsOf(raw.credentials),
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
