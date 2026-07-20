import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProfileStory, TrainerProfileDraft } from "@/lib/trainer-profile";

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

/**
 * Every uploaded image a story points at (cover + section media). Video slots
 * hold pasted links rather than storage uploads, so — like the gallery's video
 * links — they are not tracked as files here.
 */
export function storyImageUrls(stories: ProfileStory[]): string[] {
  return stories
    .flatMap((story) => [story.cover, ...story.sections.map((s) => s.media)])
    .filter((media) => media.kind === "image")
    .map((media) => media.url);
}

/** Every uploaded file a profile currently points at. */
export function profileFileUrls(profile: TrainerProfileDraft): string[] {
  return [
    profile.avatarUrl,
    profile.coverUrl,
    ...profile.gallery.map((item) => item.url),
    ...profile.credentials.map((credential) => credential.fileUrl),
    ...storyImageUrls(profile.stories),
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
 * Uploads land in storage the moment a trainer picks a file, but the profile
 * only records them on save. So swapping an image twice before saving, or
 * walking away mid-edit, strands files the diff above can never see: it only
 * knows the previously *saved* profile.
 *
 * This sweeps the trainer's folder for anything nothing points at any more.
 *
 * Two things it must not eat:
 *  - transformation before/after photos, which live in the same folder but are
 *    referenced from transformation_requests rather than the profile;
 *  - uploads from the last few minutes, which may belong to an edit still open
 *    in another section of the dashboard and not submitted yet.
 */
export const RECENT_UPLOAD_GRACE_MS = 15 * 60 * 1000;

export type StoredFile = { name: string; created_at?: string | null };

/** Which of a trainer's stored files nothing references any more. */
export function staleUploadPaths(
  files: StoredFile[],
  referencedUrls: string[],
  userId: string,
  now = Date.now(),
): string[] {
  const referenced = new Set(
    referencedUrls
      .map(storagePathFromPublicUrl)
      .filter((path): path is string => path !== null),
  );
  const cutoff = now - RECENT_UPLOAD_GRACE_MS;

  return files
    .filter((file) => {
      if (referenced.has(`${userId}/${file.name}`)) {
        return false;
      }
      // Unknown age means we cannot prove removing it is safe.
      const created = Date.parse(file.created_at ?? "");
      return Number.isFinite(created) && created < cutoff;
    })
    .map((file) => `${userId}/${file.name}`);
}

export async function sweepTrainerUploads(
  supabase: SupabaseClient,
  profile: TrainerProfileDraft,
  userId: string,
) {
  try {
    const { data: files } = await supabase.storage
      .from(TRAINER_BUCKET)
      .list(userId, { limit: 1000 });

    if (!files || files.length === 0) {
      return;
    }

    // Before/after shots live in the same folder but are referenced from
    // transformation_requests, not the profile.
    const { data: transformations } = await supabase
      .from("transformation_requests")
      .select("before_image_url, after_image_url")
      .eq("trainer_user_id", userId);

    const referencedUrls = [
      ...profileFileUrls(profile),
      ...(transformations ?? []).flatMap((row) =>
        [row.before_image_url, row.after_image_url].filter(
          (url): url is string => typeof url === "string" && url.length > 0,
        ),
      ),
    ];

    const stale = staleUploadPaths(files, referencedUrls, userId);

    if (stale.length > 0) {
      await supabase.storage.from(TRAINER_BUCKET).remove(stale);
    }
  } catch {
    // Cleanup is best effort; never fail a save over it.
  }
}

/**
 * Remove client-submitted uploads (the `submissions/` folder) that a set of
 * public URLs points at. Client transformation submissions land there rather
 * than in a trainer's own folder, so neither the per-trainer sweep nor the
 * delete-folder path reaches them — without this they leak forever.
 *
 * Restricted to the `submissions/` prefix so it can only ever delete anonymous
 * submission uploads, never a trainer's own gallery/avatar files.
 */
export async function deleteSubmissionUploads(
  supabase: SupabaseClient,
  urls: string[],
) {
  const paths = Array.from(
    new Set(
      urls
        .filter((url): url is string => typeof url === "string" && url.length > 0)
        .map(storagePathFromPublicUrl)
        .filter((path): path is string => path !== null)
        .filter((path) => path.startsWith("submissions/")),
    ),
  );

  if (paths.length === 0) {
    return;
  }

  try {
    await supabase.storage.from(TRAINER_BUCKET).remove(paths);
  } catch {
    // Best effort; never fail the caller over a storage cleanup.
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