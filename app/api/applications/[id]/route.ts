import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await request.json();

  // Si le statut change, on trace l'historique manuellement
  if (body.statut) {
    const { data: current } = await supabase
      .from("applications")
      .select("statut")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (current && current.statut !== body.statut) {
      await supabase.from("status_history").insert({
        application_id: params.id,
        ancien_statut: current.statut,
        nouveau_statut: body.statut,
        source: "manuel",
      });
    }
  }

  const { data, error } = await supabase
    .from("applications")
    .update(body)
    .eq("id", params.id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { error } = await supabase.from("applications").delete().eq("id", params.id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
