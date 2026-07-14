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
  if (hasSupabaseEnv()) {
    try {
      const supabase = createAuthBrowserClient();
      const path = `${folder}/${safeFileName(file.name)}`;
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });

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

  return { url: URL.createObjectURL(file), persisted: false };
}
