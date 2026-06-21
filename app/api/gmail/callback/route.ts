import { createClient } from "@/lib/supabase/server";
import { exchangeCodeForTokens, getGoogleUserEmail } from "@/lib/gmail";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const expectedState = request.cookies.get("gmail_oauth_state")?.value;

  if (error) {
    return NextResponse.redirect(`${appUrl}/dashboard?gmail_error=${encodeURIComponent(error)}`);
  }
  if (!code || !state || state !== expectedState) {
    return NextResponse.redirect(`${appUrl}/dashboard?gmail_error=etat_invalide`);
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${appUrl}/login`);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    if (!tokens.refresh_token) {
      // Arrive si l'utilisateur avait déjà autorisé l'app sans "prompt=consent"
      return NextResponse.redirect(
        `${appUrl}/dashboard?gmail_error=refresh_token_manquant`
      );
    }
    const googleEmail = await getGoogleUserEmail(tokens.access_token);

    const { error: dbError } = await supabase.from("email_connections").upsert(
      {
        user_id: user.id,
        google_email: googleEmail,
        refresh_token: tokens.refresh_token,
        last_sync_at: null,
      },
      { onConflict: "user_id" }
    );

    if (dbError) {
      return NextResponse.redirect(
        `${appUrl}/dashboard?gmail_error=${encodeURIComponent(dbError.message)}`
      );
    }

    const response = NextResponse.redirect(`${appUrl}/dashboard?gmail_connected=1`);
    response.cookies.delete("gmail_oauth_state");
    return response;
  } catch (e: any) {
    return NextResponse.redirect(`${appUrl}/dashboard?gmail_error=${encodeURIComponent(e.message)}`);
  }
}
