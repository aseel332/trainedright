import type { Metadata } from "next";
import {
  AdminDashboardClient,
  type AdminTrainerRow,
} from "@/components/admin-dashboard-client";
import { AdminLoginClient } from "@/components/admin-login-client";
import { adminIsConfigured, hasAdminSession } from "@/lib/server/admin-auth";
import { createAdminSupabaseClient } from "@/lib/server/supabase-admin";
import { parseProfileDraft } from "@/lib/trainer-profile";

export const metadata: Metadata = {
  title: "Admin | TrainedRight",
  description: "TrainedRight admin console.",
  robots: { index: false, follow: false },
};

const SERVICE_KEY_MISSING =
  "Add SUPABASE_SERVICE_ROLE_KEY to .env.local (Supabase dashboard → Project settings → API keys) so the admin console can read every trainer account.";

const MIGRATION_MISSING =
  "Run the migration supabase/migrations/20260715000000_trainer_publishing.sql in the Supabase SQL editor. Until it is applied, the public `trainers` table has no link back to trainer accounts, so approving someone cannot put them on the site.";

export default async function AdminPage() {
  if (!(await hasAdminSession())) {
    return <AdminLoginClient configured={adminIsConfigured()} />;
  }

  const supabase = createAdminSupabaseClient();

  if (!supabase) {
    return <AdminDashboardClient trainers={[]} loadError={SERVICE_KEY_MISSING} />;
  }

  const [accountsResult, usersResult, publishedResult] = await Promise.all([
    supabase
      .from("trainer_accounts")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    supabase.from("trainers").select("user_id, slug, is_active"),
  ]);

  // The publishing migration adds trainers.user_id; without it there is no way
  // to tell which public row belongs to which account.
  const migrationApplied = !publishedResult.error;

  const emailByUserId = new Map<string, string>(
    (usersResult.data?.users ?? []).map((user) => [user.id, user.email ?? ""]),
  );

  const publishedByUserId = new Map<string, { slug: string; active: boolean }>(
    (publishedResult.data ?? [])
      .filter((row) => row.user_id)
      .map((row) => [
        String(row.user_id),
        { slug: String(row.slug), active: Boolean(row.is_active) },
      ]),
  );

  const trainers: AdminTrainerRow[] = (accountsResult.data ?? []).map((row) => {
    const profile = parseProfileDraft(row.profile);
    const published = publishedByUserId.get(String(row.user_id));

    return {
      userId: String(row.user_id),
      publishedSlug: published?.slug ?? null,
      isLive: Boolean(published?.active),
      email: emailByUserId.get(String(row.user_id)) ?? "",
      displayName: String(row.display_name ?? "") || profile.name,
      approvalStatus: String(row.approval_status ?? "draft"),
      onboardingComplete: Boolean(row.onboarding_complete),
      submittedAt: row.submitted_at ? String(row.submitted_at) : null,
      createdAt: row.created_at ? String(row.created_at) : null,
      headline: profile.headline,
      bio: profile.bio,
      city: profile.city,
      state: profile.state,
      area: profile.area,
      whatsapp: profile.whatsapp,
      yearsExperience: profile.yearsExperience,
      specialties: profile.specialties,
      searchCategories: profile.searchCategories,
      sports: profile.sports,
      avatarUrl: profile.avatarUrl,
      planCount: profile.plans.length,
      credentialCount: profile.credentials.length,
      galleryCount: profile.gallery.length,
    };
  });

  return (
    <AdminDashboardClient
      trainers={trainers}
      loadError={
        accountsResult.error?.message ??
        (migrationApplied ? null : MIGRATION_MISSING)
      }
    />
  );
}
