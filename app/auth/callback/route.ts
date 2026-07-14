import { NextResponse, type NextRequest } from "next/server";
import { createAuthServerClient } from "@/lib/supabase-auth-server";

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/trainer/dashboard";
  }

  return value;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeNext(requestUrl.searchParams.get("next"));

  if (code) {
    const supabase = await createAuthServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      if (data.user) {
        await supabase.from("trainer_accounts").upsert(
          {
            user_id: data.user.id,
            display_name:
              data.user.user_metadata?.full_name ??
              data.user.user_metadata?.name ??
              data.user.email ??
              "",
          },
          { onConflict: "user_id" },
        );
      }

      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  const redirectUrl = new URL("/trainer/auth", requestUrl.origin);
  redirectUrl.searchParams.set("error", "auth_callback_failed");
  redirectUrl.searchParams.set("mode", "signin");
  redirectUrl.searchParams.set("next", next);
  return NextResponse.redirect(redirectUrl);
}
