import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";

export type TrainerAccount = {
  profile: unknown;
  onboarding_complete: boolean;
  approval_status: string;
  display_name: string;
};

/**
 * Every signed-in trainer must have a trainer_accounts row. A database
 * trigger creates one on sign-up, but users created before the trigger — or
 * through providers that skip it — would otherwise hit the dashboard with no
 * account. Creating it here makes sign-in self-healing.
 */
export async function getOrCreateTrainerAccount(
  supabase: SupabaseClient,
  user: User,
): Promise<TrainerAccount | null> {
  const { data: existing } = await supabase
    .from("trainer_accounts")
    .select("profile, onboarding_complete, approval_status, display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return existing as TrainerAccount;
  }

  const displayName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email ??
    "";

  // RLS: trainers may insert their own row.
  const { data: created, error } = await supabase
    .from("trainer_accounts")
    .upsert(
      { user_id: user.id, display_name: displayName },
      { onConflict: "user_id" },
    )
    .select("profile, onboarding_complete, approval_status, display_name")
    .maybeSingle();

  if (error || !created) {
    return null;
  }

  return created as TrainerAccount;
}
