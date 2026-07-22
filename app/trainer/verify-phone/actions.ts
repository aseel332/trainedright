"use server";

import { createAdminSupabaseClient } from "@/lib/server/supabase-admin";
import { createAuthServerClient } from "@/lib/server/supabase-server";

type SavePhoneResult = { ok: true } | { ok: false; error: string };

/** India mobile numbers in E.164 format. */
function isValidIndianMobile(phone: string) {
  return /^\+91[6-9]\d{9}$/.test(phone);
}

export async function saveTrainerPhone(
  phone: string,
): Promise<SavePhoneResult> {
  const supabase = await createAuthServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You need to be signed in." };
  }

  if (!isValidIndianMobile(phone)) {
    return { ok: false, error: "Enter a valid 10-digit mobile number." };
  }

  const admin = createAdminSupabaseClient();
  if (!admin) {
    return { ok: false, error: "Server is not configured to save phone numbers." };
  }

  // Temporary phone-only onboarding: store the phone and mark it confirmed so
  // existing onboarding/dashboard gates can continue to use phone_confirmed_at.
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    phone,
    phone_confirm: true,
  });
  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
