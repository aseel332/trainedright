import "server-only";

import { createAdminSupabaseClient } from "@/lib/server/supabase-admin";
import { isStorableUrl } from "@/lib/trainer-profile";

/**
 * Review / transformation link submissions.
 *
 * The row id is the share token a client receives. All reads and writes go
 * through the service-role client with explicit token + status checks, so no
 * anonymous RLS policy has to expose pending rows to enumeration.
 */

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidToken(token: string) {
  return UUID_PATTERN.test(token);
}

export type PendingRequestInfo = {
  clientName: string;
  trainerName: string;
};

export async function getPendingReviewRequest(
  token: string,
): Promise<PendingRequestInfo | null> {
  if (!isValidToken(token)) {
    return null;
  }

  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    return null;
  }

  const { data } = await supabase
    .from("review_requests")
    .select("client_name, trainer_display_name")
    .eq("id", token)
    .eq("status", "pending")
    .eq("source", "client_link")
    .maybeSingle();

  if (!data) {
    return null;
  }

  return {
    clientName: String(data.client_name ?? ""),
    trainerName: String(data.trainer_display_name ?? "") || "your coach",
  };
}

export type PendingTransformationInfo = PendingRequestInfo & {
  mode: "client_all" | "trainer_photos";
  title: string;
  resultLabel: string;
  durationLabel: string;
  beforeImageUrl: string;
  afterImageUrl: string;
};

export async function getPendingTransformationRequest(
  token: string,
): Promise<PendingTransformationInfo | null> {
  if (!isValidToken(token)) {
    return null;
  }

  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    return null;
  }

  const { data } = await supabase
    .from("transformation_requests")
    .select(
      "client_name, trainer_display_name, mode, title, result_label, duration_label, before_image_url, after_image_url",
    )
    .eq("id", token)
    .eq("status", "pending")
    .maybeSingle();

  if (!data) {
    return null;
  }

  return {
    clientName: String(data.client_name ?? ""),
    trainerName: String(data.trainer_display_name ?? "") || "your coach",
    mode: data.mode === "trainer_photos" ? "trainer_photos" : "client_all",
    title: String(data.title ?? ""),
    resultLabel: String(data.result_label ?? ""),
    durationLabel: String(data.duration_label ?? ""),
    beforeImageUrl: String(data.before_image_url ?? ""),
    afterImageUrl: String(data.after_image_url ?? ""),
  };
}

type SubmitResult = { ok: true; trainerUserId: string } | { ok: false; error: string };

const LINK_USED = "This link was already used or is no longer active.";
const NOT_CONFIGURED = "Submissions are temporarily unavailable.";

export async function submitReviewForToken(input: {
  token: string;
  rating: number;
  reviewText: string;
}): Promise<SubmitResult> {
  if (!isValidToken(input.token)) {
    return { ok: false, error: LINK_USED };
  }

  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    return { ok: false, error: NOT_CONFIGURED };
  }

  const { data: updated, error } = await supabase
    .from("review_requests")
    .update({
      status: "submitted",
      rating: input.rating,
      review_text: input.reviewText,
      submitted_at: new Date().toISOString(),
    })
    .eq("id", input.token)
    .eq("status", "pending")
    .eq("source", "client_link")
    .select("trainer_user_id");

  if (error) {
    return { ok: false, error: error.message };
  }

  if (!updated || updated.length === 0) {
    return { ok: false, error: LINK_USED };
  }

  return { ok: true, trainerUserId: String(updated[0].trainer_user_id) };
}

export async function submitTransformationForToken(input: {
  token: string;
  rating: number;
  reviewText: string;
  clientName?: string;
  title?: string;
  resultLabel?: string;
  durationLabel?: string;
  beforeImageUrl?: string;
  afterImageUrl?: string;
}): Promise<SubmitResult> {
  if (!isValidToken(input.token)) {
    return { ok: false, error: LINK_USED };
  }

  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    return { ok: false, error: NOT_CONFIGURED };
  }

  const update: Record<string, unknown> = {
    status: "submitted",
    rating: input.rating,
    review_text: input.reviewText,
    submitted_at: new Date().toISOString(),
  };

  if (input.clientName?.trim()) update.client_name = input.clientName.trim();
  if (input.title?.trim()) update.title = input.title.trim();
  if (input.resultLabel?.trim()) update.result_label = input.resultLabel.trim();
  if (input.durationLabel?.trim()) {
    update.duration_label = input.durationLabel.trim();
  }
  // Only store URLs that actually persisted to storage; ignore a tab-local
  // blob: preview from a failed client upload.
  if (isStorableUrl(input.beforeImageUrl ?? "")) {
    update.before_image_url = input.beforeImageUrl;
  }
  if (isStorableUrl(input.afterImageUrl ?? "")) {
    update.after_image_url = input.afterImageUrl;
  }

  const { data: updated, error } = await supabase
    .from("transformation_requests")
    .update(update)
    .eq("id", input.token)
    .eq("status", "pending")
    .select("trainer_user_id");

  if (error) {
    return { ok: false, error: error.message };
  }

  if (!updated || updated.length === 0) {
    return { ok: false, error: LINK_USED };
  }

  return { ok: true, trainerUserId: String(updated[0].trainer_user_id) };
}
