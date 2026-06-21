import { createClient } from "@/lib/supabase/server";
import { syncUserMailbox } from "@/lib/syncMailbox";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data: connection, error: connError } = await supabase
    .from("email_connections")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (connError || !connection) {
    return NextResponse.json({ error: "Aucune boîte mail connectée" }, { status: 400 });
  }

  try {
    const result = await syncUserMailbox(supabase, user.id, connection.refresh_token, connection.last_sync_at);

    await supabase
      .from("email_connections")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("user_id", user.id);

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Échec de la synchronisation" }, { status: 500 });
  }
}
