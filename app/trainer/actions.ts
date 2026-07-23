"use server";

import { revalidatePath } from "next/cache";
import { createAuthServerClient } from "@/lib/server/supabase-server";
import {
  submitReviewForToken,
  submitTransformationForToken,
} from "@/lib/server/token-requests";
import { syncPublishedTrainer } from "@/lib/server/trainer-publish";
import {
  deleteOrphanedUploads,
  deleteSubmissionUploads,
  sweepTrainerUploads,
} from "@/lib/server/trainer-storage";
import {
  isStorableUrl,
  parseProfileDraft,
  profileIsSubmittable,
  stripUnstorableImages,
  type TrainerProfileDraft,
} from "@/lib/trainer-profile";

export type ActionResult = {
  ok: boolean;
  error?: string;
  id?: string;
};

const NOT_CONFIGURED = "Supabase is not configured for this environment.";
const NOT_SIGNED_IN = "You need to be signed in as a trainer.";

async function trainerClient() {
  let supabase;
  try {
    supabase = await createAuthServerClient();
  } catch {
    return { error: NOT_CONFIGURED } as const;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NOT_SIGNED_IN } as const;
  }

  return { supabase, user } as const;
}


export async function saveTrainerProfile(
  rawProfile: TrainerProfileDraft,
  options: { completeOnboarding?: boolean } = {},
): Promise<ActionResult> {
  const ctx = await trainerClient();
  if ("error" in ctx) {
    return { ok: false, error: ctx.error };
  }

  // Drop any tab-local blob:/data: preview left by a failed upload so it can
  // never be persisted as a broken image URL.
  const profile = stripUnstorableImages(parseProfileDraft(rawProfile));

  // Read what the profile pointed at before this save, so images the trainer
  // replaced or removed can be cleaned out of storage afterwards.
  const { data: existing } = await ctx.supabase
    .from("trainer_accounts")
    .select("profile")
    .eq("user_id", ctx.user.id)
    .maybeSingle();
  const previousProfile = parseProfileDraft(existing?.profile);

  const update: Record<string, unknown> = {
    user_id: ctx.user.id,
    profile,
    display_name: profile.name || ctx.user.email || "",
  };

  if (options.completeOnboarding) {
    if (!profileIsSubmittable(profile)) {
      return {
        ok: false,
        error: "Complete the required fields before submitting.",
      };
    }
    update.onboarding_complete = true;
  }

  const { error } = await ctx.supabase
    .from("trainer_accounts")
    .upsert(update, { onConflict: "user_id" });

  if (error) {
    return { ok: false, error: error.message };
  }

  // An approved trainer's edits go live straight away — no admin step.
  const published = await syncPublishedTrainer(ctx.user.id);

  // Only now that both the saved profile and any live public row point at the
  // new images is it safe to drop the old ones. The diff removes the image
  // this save replaced; the sweep catches anything stranded by earlier edits.
  await deleteOrphanedUploads(
    ctx.supabase,
    previousProfile,
    profile,
    ctx.user.id,
  );
  await sweepTrainerUploads(ctx.supabase, profile, ctx.user.id);

  revalidatePath("/trainer/dashboard");
  // One sweep over every cached page: city hubs, landing pages, home.
  revalidatePath("/", "layout");
  if (published?.slug) {
    revalidatePath(`/trainers/${published.slug}`);
  }

  return { ok: true };
}

export async function submitForApproval(): Promise<ActionResult> {
  const ctx = await trainerClient();
  if ("error" in ctx) {
    return { ok: false, error: ctx.error };
  }

  const { error } = await ctx.supabase
    .from("trainer_accounts")
    .update({ approval_status: "review", submitted_at: new Date().toISOString() })
    .eq("user_id", ctx.user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/trainer/dashboard");
  return { ok: true };
}

export async function createReviewRequest(
  clientName: string,
  trainerDisplayName: string,
): Promise<ActionResult> {
  const ctx = await trainerClient();
  if ("error" in ctx) {
    return { ok: false, error: ctx.error };
  }

  const name = clientName.trim();
  if (!name) {
    return { ok: false, error: "Enter the client's name first." };
  }

  const { data, error } = await ctx.supabase
    .from("review_requests")
    .insert({
      trainer_user_id: ctx.user.id,
      trainer_display_name: trainerDisplayName.trim(),
      client_name: name,
      source: "client_link",
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not create the link." };
  }

  revalidatePath("/trainer/dashboard");
  return { ok: true, id: data.id as string };
}

export async function addTrainerReview(input: {
  clientName: string;
  rating: number;
  reviewText: string;
  consentConfirmed: boolean;
  trainerDisplayName: string;
}): Promise<ActionResult> {
  const ctx = await trainerClient();
  if ("error" in ctx) {
    return { ok: false, error: ctx.error };
  }

  if (!input.consentConfirmed) {
    return {
      ok: false,
      error: "Confirm the review is real and shared with the client's consent.",
    };
  }

  const rating = Math.min(5, Math.max(1, Number(input.rating)));
  if (!input.clientName.trim() || !input.reviewText.trim() || !rating) {
    return { ok: false, error: "Fill the client name, rating, and review." };
  }

  const { error } = await ctx.supabase.from("review_requests").insert({
    trainer_user_id: ctx.user.id,
    trainer_display_name: input.trainerDisplayName.trim(),
    client_name: input.clientName.trim(),
    source: "trainer",
    status: "submitted",
    rating,
    review_text: input.reviewText.trim(),
    consent_confirmed: true,
    submitted_at: new Date().toISOString(),
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  await syncPublishedTrainer(ctx.user.id);

  revalidatePath("/trainer/dashboard");
  return { ok: true };
}

export async function deleteReviewRequest(id: string): Promise<ActionResult> {
  const ctx = await trainerClient();
  if ("error" in ctx) {
    return { ok: false, error: ctx.error };
  }

  const { error } = await ctx.supabase
    .from("review_requests")
    .delete()
    .eq("id", id)
    .eq("trainer_user_id", ctx.user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  await syncPublishedTrainer(ctx.user.id);

  revalidatePath("/trainer/dashboard");
  return { ok: true };
}

export async function createTransformationRequest(input: {
  mode: "client_all" | "trainer_photos";
  clientName: string;
  trainerDisplayName: string;
  title?: string;
  resultLabel?: string;
  durationLabel?: string;
  beforeImageUrl?: string;
  afterImageUrl?: string;
}): Promise<ActionResult> {
  const ctx = await trainerClient();
  if ("error" in ctx) {
    return { ok: false, error: ctx.error };
  }

  if (!input.clientName.trim()) {
    return { ok: false, error: "Enter the client's name first." };
  }

  // Only keep image URLs that actually persisted to storage; a failed upload
  // leaves a tab-local blob: URL that must not be stored.
  const beforeImageUrl = isStorableUrl(input.beforeImageUrl ?? "")
    ? input.beforeImageUrl!
    : "";
  const afterImageUrl = isStorableUrl(input.afterImageUrl ?? "")
    ? input.afterImageUrl!
    : "";

  if (input.mode === "trainer_photos" && (!beforeImageUrl || !afterImageUrl)) {
    return {
      ok: false,
      error: "Add both before and after photos for this flow.",
    };
  }

  const { data, error } = await ctx.supabase
    .from("transformation_requests")
    .insert({
      trainer_user_id: ctx.user.id,
      trainer_display_name: input.trainerDisplayName.trim(),
      mode: input.mode,
      client_name: input.clientName.trim(),
      title: input.title?.trim() ?? "",
      result_label: input.resultLabel?.trim() ?? "",
      duration_label: input.durationLabel?.trim() ?? "",
      before_image_url: beforeImageUrl,
      after_image_url: afterImageUrl,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not create the link." };
  }

  revalidatePath("/trainer/dashboard");
  return { ok: true, id: data.id as string };
}

export async function deleteTransformationRequest(
  id: string,
): Promise<ActionResult> {
  const ctx = await trainerClient();
  if ("error" in ctx) {
    return { ok: false, error: ctx.error };
  }

  // Read the photos this row referenced before deleting, so client-submitted
  // uploads in the shared `submissions/` folder can be cleaned up afterwards.
  const { data: existing } = await ctx.supabase
    .from("transformation_requests")
    .select("before_image_url, after_image_url")
    .eq("id", id)
    .eq("trainer_user_id", ctx.user.id)
    .maybeSingle();

  const { error } = await ctx.supabase
    .from("transformation_requests")
    .delete()
    .eq("id", id)
    .eq("trainer_user_id", ctx.user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  await syncPublishedTrainer(ctx.user.id);

  if (existing) {
    await deleteSubmissionUploads(ctx.supabase, [
      String(existing.before_image_url ?? ""),
      String(existing.after_image_url ?? ""),
    ]);
  }

  revalidatePath("/trainer/dashboard");
  return { ok: true };
}

export async function submitReviewByToken(input: {
  token: string;
  rating: number;
  reviewText: string;
}): Promise<ActionResult> {
  const rating = Math.min(5, Math.max(1, Number(input.rating)));
  if (!rating || !input.reviewText.trim()) {
    return { ok: false, error: "Add a rating and a few words." };
  }

  const result = await submitReviewForToken({
    token: input.token,
    rating,
    reviewText: input.reviewText.trim(),
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  await syncPublishedTrainer(result.trainerUserId);

  return { ok: true };
}

export async function submitTransformationByToken(input: {
  token: string;
  rating: number;
  reviewText: string;
  clientName?: string;
  title?: string;
  resultLabel?: string;
  durationLabel?: string;
  beforeImageUrl?: string;
  afterImageUrl?: string;
}): Promise<ActionResult> {
  const rating = Math.min(5, Math.max(1, Number(input.rating)));
  if (!rating || !input.reviewText.trim()) {
    return { ok: false, error: "Add a rating and a few words." };
  }

  const result = await submitTransformationForToken({
    ...input,
    rating,
    reviewText: input.reviewText.trim(),
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  await syncPublishedTrainer(result.trainerUserId);

  return { ok: true };
}
