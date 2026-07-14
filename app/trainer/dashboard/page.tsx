import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TrainerDashboardClient } from "@/components/trainer-dashboard-client";
import {
  mapReviewRequestRow,
  mapTransformationRequestRow,
} from "@/lib/link-requests";
import { createAuthServerClient } from "@/lib/supabase-auth-server";
import { parseProfileDraft } from "@/lib/trainer-profile";

export const metadata: Metadata = {
  title: "Trainer dashboard | TrainedRight",
  description:
    "Track demand, manage your profile, and collect verified reviews and transformations.",
};

export default async function TrainerDashboardPage() {
  const supabase = await createAuthServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/trainer/auth?mode=signin&next=/trainer/dashboard");
  }

  const { data: account } = await supabase
    .from("trainer_accounts")
    .select("profile, onboarding_complete, approval_status, display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!account?.onboarding_complete) {
    redirect("/trainer/onboarding");
  }

  const [reviewsResult, transformationsResult] = await Promise.all([
    supabase
      .from("review_requests")
      .select("*")
      .eq("trainer_user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("transformation_requests")
      .select("*")
      .eq("trainer_user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <TrainerDashboardClient
      userEmail={user.email ?? "Trainer"}
      userId={user.id}
      approvalStatus={account.approval_status ?? "draft"}
      initialProfile={parseProfileDraft(account.profile)}
      initialReviews={(reviewsResult.data ?? []).map(mapReviewRequestRow)}
      initialTransformations={(transformationsResult.data ?? []).map(
        mapTransformationRequestRow,
      )}
    />
  );
}
