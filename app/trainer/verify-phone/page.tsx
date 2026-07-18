import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TrainerPhoneVerifyClient } from "@/components/trainer-phone-verify-client";
import { createAuthServerClient } from "@/lib/server/supabase-server";

export const metadata: Metadata = {
  title: "Verify your phone | TrainedRight",
  description:
    "Confirm your phone number to continue setting up your coach profile.",
};

export default async function TrainerVerifyPhonePage() {
  const supabase = await createAuthServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/trainer/auth?mode=signin&next=/trainer/verify-phone");
  }

  // Phone already confirmed on the auth user — nothing to do here.
  if (user.phone_confirmed_at) {
    redirect("/trainer/onboarding");
  }

  return <TrainerPhoneVerifyClient />;
}
