import { createClient } from "@/lib/supabase/server";
import { buildGoogleAuthUrl } from "@/lib/gmail";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL));
  }

  const state = randomBytes(16).toString("hex");
  const url = buildGoogleAuthUrl(state);

  const response = NextResponse.redirect(url);
  // Cookie de courte durée pour vérifier le state au retour (anti-CSRF)
  response.cookies.set("gmail_oauth_state", state, {
    httpOnly: true,
    secure: true,
    maxAge: 600,
    path: "/",
  });
  return response;
}
