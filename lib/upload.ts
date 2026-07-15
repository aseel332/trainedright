"use client";

import { createAuthBrowserClient } from "@/lib/supabase-auth-client";

export type UploadResult = {
  url: string;
  /** false when Supabase storage is unavailable and a temporary blob: URL was used. */
  persisted: boolean;
};

const BUCKET = "trainer-uploads";

function hasSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  );
}

function safeFileName(name: string) {
  const dot = name.lastIndexOf(".");
  const ext = dot >= 0 ? name.slice(dot + 1).toLowerCase() : "bin";
  return `${crypto.randomUUID()}.${ext.replace(/[^a-z0-9]/g, "") || "bin"}`;
}

/** Long edge of a stored photo. Covers and gallery shots never need more. */
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;
/** Below this a photo is already web-sized; re-encoding would only lose quality. */
const COMPRESS_ABOVE_BYTES = 300_000;

/**
 * Shrink camera-sized photos before upload.
 *
 * A phone picture is several MB, which is slow to serve and can exceed the
 * 7s timeout Next's image optimizer allows for fetching an upstream image.
 * Returns the original file untouched for PDFs, small images, and anything
 * the browser cannot decode.
 */
async function compressImage(file: File): Promise<File> {
  const skip =
    !file.type.startsWith("image/") ||
    file.type === "image/gif" ||
    file.type === "image/svg+xml" ||
    file.size <= COMPRESS_ABOVE_BYTES;

  if (skip || typeof createImageBitmap !== "function") {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(
      1,
      MAX_DIMENSION / Math.max(bitmap.width, bitmap.height),
    );
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      bitmap.close();
      return file;
    }

    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY);
    });

    // Keep the original when re-encoding did not actually help.
    if (!blob || blob.size >= file.size) {
      return file;
    }

    const base = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${base}.jpeg`, { type: "image/jpeg" });
  } catch {
    return file;
  }
}

/**
 * Upload a file into the public trainer-uploads bucket.
 * `folder` must be the signed-in trainer's user id, or "submissions"
 * for anonymous client link submissions (matches storage RLS).
 * Falls back to a local object URL when storage is unavailable so the
 * UI keeps working in unconfigured dev environments.
 */
export async function uploadPublicFile(
  file: File,
  folder: string,
): Promise<UploadResult> {
  const upload = await compressImage(file);

  if (hasSupabaseEnv()) {
    try {
      const supabase = createAuthBrowserClient();
      const path = `${folder}/${safeFileName(upload.name)}`;
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, upload, { contentType: upload.type, upsert: false });

      if (!error) {
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
        if (data.publicUrl) {
          return { url: data.publicUrl, persisted: true };
        }
      }
    } catch {
      // fall through to the local preview below
    }
  }

  return { url: URL.createObjectURL(upload), persisted: false };
}
