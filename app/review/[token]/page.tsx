import type { Metadata } from "next";
import { ReviewSubmitClient } from "@/components/review-submit-client";
import { getPendingReviewRequest } from "@/lib/server/token-requests";

export const metadata: Metadata = {
  title: "Rate your coach | TrainedRight",
  description: "Share your experience with your coach on TrainedRight.",
};

export default async function ReviewTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const request = await getPendingReviewRequest(token);

  return (
    <ReviewSubmitClient
      token={token}
      clientName={request?.clientName ?? null}
      trainerName={request?.trainerName ?? null}
    />
  );
}
