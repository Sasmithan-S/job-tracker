import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  // Vérifie que la candidature appartient bien à l'utilisateur (RLS le ferait
  // aussi, mais on garde un message clair)
  const { data: app } = await supabase
    .from("applications")
    .select("id")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!app) return NextResponse.json({ error: "Candidature introuvable" }, { status: 404 });

  const { data, error } = await supabase
    .from("status_history")
    .select("*")
    .eq("application_id", params.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
