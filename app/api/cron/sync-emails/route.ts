import { createServiceClient } from "@/lib/supabase/server";
import { syncUserMailbox } from "@/lib/syncMailbox";
import { NextRequest, NextResponse } from "next/server";

// Déclenché par Vercel Cron (voir vercel.json) une fois par jour sur le plan
// Hobby gratuit. L'utilisateur peut aussi forcer une synchro via le bouton
// "Synchroniser maintenant" (route /api/gmail/sync), sans cette limite.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const supabase = createServiceClient();

  const { data: connections, error } = await supabase.from("email_connections").select("*");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const summary: Record<string, any> = {};

  for (const connection of connections ?? []) {
    try {
      const result = await syncUserMailbox(
        supabase,
        connection.user_id,
        connection.refresh_token,
        connection.last_sync_at
      );
      await supabase
        .from("email_connections")
        .update({ last_sync_at: new Date().toISOString() })
        .eq("user_id", connection.user_id);
      summary[connection.google_email] = result;
    } catch (e: any) {
      summary[connection.google_email] = { erreur: e.message };
    }
  }

  return NextResponse.json({ ok: true, summary });
}
