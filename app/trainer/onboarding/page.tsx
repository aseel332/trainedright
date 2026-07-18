import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TrainerOnboardingClient } from "@/components/trainer-onboarding-client";
import { createAuthServerClient } from "@/lib/server/supabase-server";
import { getOrCreateTrainerAccount } from "@/lib/server/trainer-account";
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

  // Phone confirmation is the first gate for a new trainer.
  if (!user.phone_confirmed_at) {
    redirect("/trainer/verify-phone");
  }

  const account = await getOrCreateTrainerAccount(supabase, user);

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
