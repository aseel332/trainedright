"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  ADMIN_SESSION_COOKIE,
  adminIsConfigured,
  createAdminSessionToken,
  hasAdminSession,
  verifyAdminCredentials,
} from "@/lib/admin-auth";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import {
  publishTrainerAccount,
  unpublishTrainerAccount,
} from "@/lib/trainer-publish";
import { deleteTrainerFolder } from "@/lib/trainer-storage";

export type AdminActionResult = {
  ok: boolean;
  error?: string;
};

const SESSION_EXPIRED = "Your admin session expired. Sign in again.";
const SERVICE_NOT_CONFIGURED =
  "SUPABASE_SERVICE_ROLE_KEY is not set, so admin actions are disabled.";

export async function adminSignIn(
  _previous: AdminActionResult | null,
  formData: FormData,
): Promise<AdminActionResult> {
  if (!adminIsConfigured()) {
    return {
      ok: false,
      error: "Set ADMIN_EMAIL and ADMIN_PASSWORD in .env.local first.",
    };
  }

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!verifyAdminCredentials(email, password)) {
    return { ok: false, error: "That email and password do not match." };
  }

  const token = createAdminSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token.value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(token.expiresAt),
  });

  revalidatePath("/admin");
  redirect("/admin");
}

export async function adminSignOut() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
  revalidatePath("/admin");
  redirect("/admin");
}

async function requireAdmin() {
  if (!(await hasAdminSession())) {
    return { error: SESSION_EXPIRED } as const;
  }

  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    return { error: SERVICE_NOT_CONFIGURED } as const;
  }

  return { supabase } as const;
}

const APPROVAL_STATUSES = ["approved", "rejected", "review"] as const;
export type AdminApprovalStatus = (typeof APPROVAL_STATUSES)[number];

export async function setTrainerApproval(
  userId: string,
  status: AdminApprovalStatus,
): Promise<AdminActionResult> {
  const ctx = await requireAdmin();
  if ("error" in ctx) {
    return { ok: false, error: ctx.error };
  }

  if (!userId || !APPROVAL_STATUSES.includes(status)) {
    return { ok: false, error: "Invalid approval update." };
  }

  const { error } = await ctx.supabase
    .from("trainer_accounts")
    .update({ approval_status: status })
    .eq("user_id", userId);

  if (error) {
    return { ok: false, error: error.message };
  }

  // Approval is what puts a trainer on the public site: copy their profile
  // into the `trainers` tables the marketplace reads. Anything else hides them
  // again.
  const publish =
    status === "approved"
      ? await publishTrainerAccount(userId)
      : await unpublishTrainerAccount(userId);

  if (!publish.ok) {
    return {
      ok: false,
      error: `Status saved, but publishing failed: ${publish.error}`,
    };
  }

  revalidatePath("/admin");
  revalidatePath("/trainers");
  revalidatePath("/");
  if (publish.slug) {
    revalidatePath(`/trainers/${publish.slug}`);
  }

  return { ok: true };
}

/** Force a re-copy of the profile onto the public site. */
export async function republishTrainer(
  userId: string,
): Promise<AdminActionResult> {
  const ctx = await requireAdmin();
  if ("error" in ctx) {
    return { ok: false, error: ctx.error };
  }

  const result = await publishTrainerAccount(userId);

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidatePath("/admin");
  revalidatePath("/trainers");
  revalidatePath("/");
  if (result.slug) {
    revalidatePath(`/trainers/${result.slug}`);
  }

  return { ok: true };
}

export async function deleteTrainer(userId: string): Promise<AdminActionResult> {
  const ctx = await requireAdmin();
  if ("error" in ctx) {
    return { ok: false, error: ctx.error };
  }

  if (!userId) {
    return { ok: false, error: "Missing trainer id." };
  }

  // Storage objects are not part of the auth-user cascade, so clear the
  // trainer's uploads first — once the account row is gone we no longer know
  // the folder was theirs.
  await deleteTrainerFolder(ctx.supabase, userId);

  // Deleting the auth user cascades to trainer_accounts, review_requests,
  // transformation_requests, and the published `trainers` row. If the auth
  // user is already gone, fall back to removing the orphaned rows.
  const { error: authError } = await ctx.supabase.auth.admin.deleteUser(userId);

  if (authError) {
    const [accountResult] = await Promise.all([
      ctx.supabase.from("trainer_accounts").delete().eq("user_id", userId),
      ctx.supabase.from("trainers").delete().eq("user_id", userId),
    ]);

    if (accountResult.error) {
      return { ok: false, error: authError.message };
    }
  }

  revalidatePath("/admin");
  revalidatePath("/trainers");
  revalidatePath("/");
  return { ok: true };
}
