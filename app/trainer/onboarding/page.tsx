import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TrainerOnboardingClient } from "@/components/trainer-onboarding-client";
import { createAuthServerClient } from "@/lib/supabase-auth-server";
import { parseProfileDraft } from "@/lib/trainer-profile";

export const metadata: Metadata = {
  title: "Set up your trainer profile | TrainedRight",
  description: "A guided setup for your TrainedRight coach profile.",
};

export default async function TrainerOnboardingPage() {
  const supabase = await createAuthServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/trainer/auth?mode=signin&next=/trainer/onboarding");
  }

  const { data: account } = await supabase
    .from("trainer_accounts")
    .select("profile, onboarding_complete, display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (account?.onboarding_complete) {
    redirect("/trainer/dashboard");
  }

  const profile = parseProfileDraft(account?.profile);
  if (!profile.name) {
    profile.name =
      (user.user_metadata?.full_name as string | undefined) ??
      account?.display_name ??
      "";
  }

  return <TrainerOnboardingClient initialProfile={profile} userId={user.id} />;
}
