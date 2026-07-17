"use client";

/**
 * Client-side "saved coaches" shortlist. Visitors don't have accounts, so the
 * shortlist lives in localStorage on their device.
 */

const STORAGE_KEY = "tr_saved_trainers";
const CHANGE_EVENT = "tr-saved-trainers-change";

/** Re-render subscribers when the shortlist changes (this tab or another). */
export function subscribeSavedTrainers(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

export function getSavedTrainerSlugs(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export function isTrainerSaved(slug: string): boolean {
  return getSavedTrainerSlugs().includes(slug);
}

/** Returns the new saved state for the slug. */
export function toggleSavedTrainer(slug: string): boolean {
  const saved = getSavedTrainerSlugs();
  const next = saved.includes(slug)
    ? saved.filter((item) => item !== slug)
    : [...saved, slug];

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage may be unavailable (private mode); the toggle is best-effort.
  }

  window.dispatchEvent(new Event(CHANGE_EVENT));

  return next.includes(slug);
}
