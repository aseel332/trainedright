import { NextResponse, type NextRequest } from "next/server";
import { createAuthServerClient } from "@/lib/server/supabase-server";

/**
 * Signing out changes auth state, so it only answers POST (a GET link could
 * be triggered cross-site). The dashboard submits a form to this route.
 */
export async function POST(request: NextRequest) {
  const supabase = await createAuthServerClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
