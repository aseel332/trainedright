import type { SupabaseClient } from "@supabase/supabase-js";
import type { TrainerProfileDraft } from "@/lib/trainer-profile";

export const TRAINER_BUCKET = "trainer-uploads";

const PUBLIC_URL_MARKER = `/storage/v1/object/public/${TRAINER_BUCKET}/`;

/**
 * The path inside the bucket for a public URL we uploaded, or null for
 * anything else (blob: previews, remote stock photos, malformed values).
 */
export function storagePathFromPublicUrl(url: string): string | null {
  const index = url.indexOf(PUBLIC_URL_MARKER);

  if (index === -1) {
    return null;
  }

  const path = url.slice(index + PUBLIC_URL_MARKER.length).split(/[?#]/)[0];
  return path ? decodeURIComponent(path) : null;
}

/** Every uploaded file a profile currently points at. */
export function profileFileUrls(profile: TrainerProfileDraft): string[] {
  return [
    profile.avatarUrl,
    profile.coverUrl,
    ...profile.gallery.map((item) => item.url),
    ...profile.credentials.map((credential) => credential.fileUrl),
  ].filter((url) => url.length > 0);
}

/**
 * Files the previous profile referenced that the new one no longer does —
 * i.e. images the trainer replaced or removed.
 *
 * Compares whole sets, so an image still used somewhere else (the same file
 * as both avatar and gallery shot) is never dropped. Restricted to the
 * trainer's own folder so a stray URL can never delete someone else's file.
 */
export function orphanedStoragePaths(
  previous: TrainerProfileDraft,
  next: TrainerProfileDraft,
  userId: string,
): string[] {
  const kept = new Set(profileFileUrls(next));
  const paths = profileFileUrls(previous)
    .filter((url) => !kept.has(url))
    .map(storagePathFromPublicUrl)
    .filter((path): path is string => path !== null)
    .filter((path) => path.startsWith(`${userId}/`));

  return Array.from(new Set(paths));
}

/** Remove images the trainer replaced or deleted. Never throws. */
export async function deleteOrphanedUploads(
  supabase: SupabaseClient,
  previous: TrainerProfileDraft,
  next: TrainerProfileDraft,
  userId: string,
) {
  const paths = orphanedStoragePaths(previous, next, userId);

  if (paths.length === 0) {
    return;
  }

  try {
    await supabase.storage.from(TRAINER_BUCKET).remove(paths);
  } catch {
    // Losing a cleanup is not worth failing the trainer's save over.
  }
}

/**
 * Drop everything a trainer ever uploaded. Deleting the auth user cascades
 * their database rows, but storage objects are not part of that cascade.
 */
export async function deleteTrainerFolder(
  supabase: SupabaseClient,
  userId: string,
) {
  try {
    const { data } = await supabase.storage
      .from(TRAINER_BUCKET)
      .list(userId, { limit: 1000 });

    if (!data || data.length === 0) {
      return;
    }

    await supabase.storage
      .from(TRAINER_BUCKET)
      .remove(data.map((file) => `${userId}/${file.name}`));
  } catch {
    // Same here: never block the delete on storage cleanup.
  }
}
