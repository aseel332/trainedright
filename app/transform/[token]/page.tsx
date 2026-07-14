import type { Metadata } from "next";
import { TransformationSubmitClient } from "@/components/transformation-submit-client";
import { createAuthServerClient } from "@/lib/supabase-auth-server";

export const metadata: Metadata = {
  title: "Share your transformation | TrainedRight",
  description: "Submit your before/after story for your coach on TrainedRight.",
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function TransformationTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  let request: {
    mode: "client_all" | "trainer_photos";
    clientName: string;
    trainerName: string;
    title: string;
    resultLabel: string;
    durationLabel: string;
    beforeImageUrl: string;
    afterImageUrl: string;
  } | null = null;

  if (UUID_PATTERN.test(token)) {
    try {
      const supabase = await createAuthServerClient();
      const { data } = await supabase
        .from("transformation_requests")
        .select(
          "mode, client_name, trainer_display_name, title, result_label, duration_label, before_image_url, after_image_url",
        )
        .eq("id", token)
        .eq("status", "pending")
        .maybeSingle();

      if (data) {
        request = {
          mode: data.mode === "trainer_photos" ? "trainer_photos" : "client_all",
          clientName: (data.client_name as string) || "",
          trainerName:
            (data.trainer_display_name as string) || "your coach",
          title: (data.title as string) || "",
          resultLabel: (data.result_label as string) || "",
          durationLabel: (data.duration_label as string) || "",
          beforeImageUrl: (data.before_image_url as string) || "",
          afterImageUrl: (data.after_image_url as string) || "",
        };
      }
    } catch {
      request = null;
    }
  }

  return <TransformationSubmitClient token={token} request={request} />;
}
