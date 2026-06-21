import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await request.json();
  const { poste, entreprise, lien, type_emploi, statut, numero_reference, date_candidature, notes } = body;

  if (!poste || !entreprise || !lien) {
    return NextResponse.json({ error: "Poste, entreprise et lien sont requis" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("applications")
    .insert({
      user_id: user.id,
      poste,
      entreprise,
      lien,
      type_emploi: type_emploi || "CDI",
      statut: statut || "en_attente",
      numero_reference: numero_reference || null,
      date_candidature: date_candidature || new Date().toISOString().slice(0, 10),
      notes: notes || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("status_history").insert({
    application_id: data.id,
    ancien_statut: null,
    nouveau_statut: data.statut,
    source: "manuel",
  });

  return NextResponse.json(data);
}
