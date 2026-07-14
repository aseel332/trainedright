import type { Metadata } from "next";
import { TrainerAuthClient } from "@/components/trainer-auth-client";

export const metadata: Metadata = {
  title: "Trainer sign in | TrainedRight",
  description: "Sign in or create a trainer account on TrainedRight.",
};

type TrainerAuthPageProps = {
  searchParams: Promise<{
    mode?: string;
    next?: string;
    error?: string;
  }>;
};

export default async function TrainerAuthPage({
  searchParams,
}: TrainerAuthPageProps) {
  const params = await searchParams;
  const initialMode = params.mode === "signup" ? "signup" : "signin";

  return (
    <TrainerAuthClient
      initialMode={initialMode}
      next={params.next ?? "/trainer/dashboard"}
      callbackError={params.error}
    />
  );
}
