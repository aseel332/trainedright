"use client";

import { useEffect, useState } from "react";
import { createAuthBrowserClient } from "@/lib/client/supabase-browser";

export type TrainerApproval = "draft" | "review" | "approved" | "rejected";

export type TrainerSession =
  | { status: "loading" }
  | { status: "signed-out" }
  | {
      status: "signed-in";
      email: string;
      /** Display name from the trainer's account, falling back to their email. */
      name: string;
      approval: TrainerApproval;
      /** Slug of their live public profile, or null when not published. */
      publicSlug: string | null;
    };

/** Whether Supabase auth is wired up at all in this build. */
const AUTH_CONFIGURED = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
);

const APPROVALS: TrainerApproval[] = [
  "draft",
  "review",
  "approved",
  "rejected",
];

function approvalOf(value: unknown): TrainerApproval {
  return APPROVALS.includes(value as TrainerApproval)
    ? (value as TrainerApproval)
    : "draft";
}

/**
 * "dhruv.raval@example.com" → "Dhruv Raval". A stand-in for the display name
 * until the account row loads, or when the trainer never set one.
 */
function nameFromEmail(email: string) {
  const words = (email.split("@")[0] ?? "")
    .split(/[._-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1));

  return words.length > 0 ? words.join(" ") : "Trainer";
}

export function trainerInitials(name: string) {
  const parts = name.split(/[\s@._-]+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "");
  return letters.join("") || "T";
}

/**
 * Who is signed in, resolved in the browser.
 *
 * The header renders on statically generated pages (city and profession hubs),
 * so it cannot read the session on the server without turning those pages
 * dynamic. Reading it here keeps every page's caching intact and — because it
 * subscribes to `onAuthStateChange` — the header corrects itself the moment a
 * trainer signs in or out in any tab.
 *
 * `status: "loading"` only ever appears before the first resolution, so the
 * header can hold the space instead of flashing the wrong state.
 */
export function useTrainerSession(): TrainerSession {
  // Public env vars are inlined at build time, so whether auth exists at all is
  // known during the first render — no need to start in "loading" and correct
  // it from an effect when the answer is already "nobody".
  const [session, setSession] = useState<TrainerSession>(
    AUTH_CONFIGURED ? { status: "loading" } : { status: "signed-out" },
  );

  useEffect(() => {
    if (!AUTH_CONFIGURED) {
      return;
    }

    let active = true;
    const supabase = createAuthBrowserClient();

    async function resolve(userId: string, email: string) {
      // Both are best-effort: a trainer who has not finished onboarding has no
      // account row yet, and an unapproved one has no public profile.
      const [accountResult, publishedResult] = await Promise.all([
        supabase
          .from("trainer_accounts")
          .select("display_name, approval_status")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("trainers")
          .select("slug")
          .eq("user_id", userId)
          .maybeSingle(),
      ]);

      if (!active) {
        return;
      }

      const displayName = String(accountResult.data?.display_name ?? "").trim();

      setSession({
        status: "signed-in",
        email,
        name: displayName || nameFromEmail(email),
        approval: approvalOf(accountResult.data?.approval_status),
        publicSlug: publishedResult.data?.slug
          ? String(publishedResult.data.slug)
          : null,
      });
    }

    function apply(user: { id: string; email?: string } | null | undefined) {
      if (!active) {
        return;
      }

      if (!user) {
        setSession({ status: "signed-out" });
        return;
      }

      const email = user.email ?? "";
      // Show the signed-in state immediately from the session we already have,
      // then enrich it with the account details when they land.
      setSession({
        status: "signed-in",
        email,
        name: nameFromEmail(email),
        approval: "draft",
        publicSlug: null,
      });
      void resolve(user.id, email);
    }

    supabase.auth
      .getSession()
      .then(({ data }) => apply(data.session?.user))
      .catch(() => {
        if (active) {
          setSession({ status: "signed-out" });
        }
      });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, next) => apply(next?.user),
    );

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return session;
}
