import { NextResponse, type NextRequest } from "next/server";
import { createAuthServerClient } from "@/lib/supabase-auth-server";

export async function GET(request: NextRequest) {
  const supabase = await createAuthServerClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(
    new URL("/trainer/auth?mode=signin", request.url),
  );
}
