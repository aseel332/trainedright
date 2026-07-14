"use server";

import { revalidatePath } from "next/cache";
import { createAuthServerClient } from "@/lib/supabase-auth-server";
import {
  parseProfileDraft,
  profileIsSubmittable,
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

async function anonClient() {
  try {
    return { supabase: await createAuthServerClient() } as const;
  } catch {
    return { error: NOT_CONFIGURED } as const;
  }
}

export async function saveTrainerProfile(
  rawProfile: TrainerProfileDraft,
  options: { completeOnboarding?: boolean } = {},
): Promise<ActionResult> {
  const ctx = await trainerClient();
  if ("error" in ctx) {
    return { ok: false, error: ctx.error };
  }

  const profile = parseProfileDraft(rawProfile);
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

  revalidatePath("/trainer/dashboard");
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

  if (
    input.mode === "trainer_photos" &&
    (!input.beforeImageUrl || !input.afterImageUrl)
  ) {
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
      before_image_url: input.beforeImageUrl ?? "",
      after_image_url: input.afterImageUrl ?? "",
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

  const { error } = await ctx.supabase
    .from("transformation_requests")
    .delete()
    .eq("id", id)
    .eq("trainer_user_id", ctx.user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/trainer/dashboard");
  return { ok: true };
}

export async function submitReviewByToken(input: {
  token: string;
  rating: number;
  reviewText: string;
}): Promise<ActionResult> {
  const ctx = await anonClient();
  if ("error" in ctx) {
    return { ok: false, error: ctx.error };
  }

  const rating = Math.min(5, Math.max(1, Number(input.rating)));
  if (!rating || !input.reviewText.trim()) {
    return { ok: false, error: "Add a rating and a few words." };
  }

  const { data, error } = await ctx.supabase
    .from("review_requests")
    .update({
      status: "submitted",
      rating,
      review_text: input.reviewText.trim(),
      submitted_at: new Date().toISOString(),
    })
    .eq("id", input.token)
    .eq("status", "pending")
    .select("id");

  if (error) {
    return { ok: false, error: error.message };
  }

  if (!data || data.length === 0) {
    return {
      ok: false,
      error: "This link was already used or is no longer active.",
    };
  }

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
  const ctx = await anonClient();
  if ("error" in ctx) {
    return { ok: false, error: ctx.error };
  }

  const rating = Math.min(5, Math.max(1, Number(input.rating)));
  if (!rating || !input.reviewText.trim()) {
    return { ok: false, error: "Add a rating and a few words." };
  }

  const update: Record<string, unknown> = {
    status: "submitted",
    rating,
    review_text: input.reviewText.trim(),
    submitted_at: new Date().toISOString(),
  };

  if (input.clientName?.trim()) update.client_name = input.clientName.trim();
  if (input.title?.trim()) update.title = input.title.trim();
  if (input.resultLabel?.trim()) update.result_label = input.resultLabel.trim();
  if (input.durationLabel?.trim()) {
    update.duration_label = input.durationLabel.trim();
  }
  if (input.beforeImageUrl) update.before_image_url = input.beforeImageUrl;
  if (input.afterImageUrl) update.after_image_url = input.afterImageUrl;

  const { data, error } = await ctx.supabase
    .from("transformation_requests")
    .update(update)
    .eq("id", input.token)
    .eq("status", "pending")
    .select("id");

  if (error) {
    return { ok: false, error: error.message };
  }

  if (!data || data.length === 0) {
    return {
      ok: false,
      error: "This link was already used or is no longer active.",
    };
  }

  return { ok: true };
}
