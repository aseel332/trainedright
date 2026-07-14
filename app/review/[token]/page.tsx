import type { Metadata } from "next";
import { ReviewSubmitClient } from "@/components/review-submit-client";
import { createAuthServerClient } from "@/lib/supabase-auth-server";

export const metadata: Metadata = {
  title: "Rate your coach | TrainedRight",
  description: "Share your experience with your coach on TrainedRight.",
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ReviewTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  let request: {
    clientName: string;
    trainerName: string;
  } | null = null;

  if (UUID_PATTERN.test(token)) {
    try {
      const supabase = await createAuthServerClient();
      const { data } = await supabase
        .from("review_requests")
        .select("client_name, trainer_display_name, status")
        .eq("id", token)
        .eq("status", "pending")
        .maybeSingle();

      if (data) {
        request = {
          clientName: data.client_name as string,
          trainerName: (data.trainer_display_name as string) || "your coach",
        };
      }
    } catch {
      request = null;
    }
  }

  return (
    <ReviewSubmitClient
      token={token}
      clientName={request?.clientName ?? null}
      trainerName={request?.trainerName ?? null}
    />
  );
}
