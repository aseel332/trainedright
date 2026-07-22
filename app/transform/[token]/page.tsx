import type { Metadata } from "next";
import { TransformationSubmitClient } from "@/components/transformation-submit-client";
import { getPendingTransformationRequest } from "@/lib/server/token-requests";

export const metadata: Metadata = {
  title: "Share Your Transformation",
  description: "Submit your before/after story for your coach on TrainedRight.",
  robots: { index: false, follow: false },
};

export default async function TransformationTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const request = await getPendingTransformationRequest(token);

  return <TransformationSubmitClient token={token} request={request} />;
}
