import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TrainerAuthClient } from "@/components/trainer-auth-client";
import { createAuthServerClient } from "@/lib/server/supabase-server";

export const metadata: Metadata = {
  title: "Trainer Sign In",
  description: "Sign in or create a trainer account on TrainedRight.",
  robots: { index: false, follow: false },
};

type TrainerAuthPageProps = {
  searchParams: Promise<{
    mode?: string;
    next?: string;
    error?: string;
  }>;
};

function safeNext(value: string | undefined) {
  return value && value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/trainer/dashboard";
}

export default async function TrainerAuthPage({
  searchParams,
}: TrainerAuthPageProps) {
  const params = await searchParams;

  // The proxy already bounces signed-in trainers off this page; this guard
  // covers direct renders too, so a logged-in trainer can never see the
  // sign-in form again (e.g. via the browser back button).
  const supabase = await createAuthServerClient();
  const { data } = await supabase.auth.getClaims();

  if (data?.claims) {
    redirect(safeNext(params.next));
  }

  const initialMode = params.mode === "signup" ? "signup" : "signin";

  return (
    <TrainerAuthClient
      initialMode={initialMode}
      next={params.next ?? "/trainer/dashboard"}
      callbackError={params.error}
    />
  );
}
