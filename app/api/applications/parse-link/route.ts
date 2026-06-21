import { createClient } from "@/lib/supabase/server";
import { fetchAndParseJobPosting } from "@/lib/linkParser";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { lien } = await request.json();
  if (!lien || typeof lien !== "string") {
    return NextResponse.json({ error: "Lien manquant" }, { status: 400 });
  }

  try {
    const info = await fetchAndParseJobPosting(lien);
    if (!info.poste && !info.entreprise) {
      return NextResponse.json(
        { error: "Rien trouvé sur cette page, complète manuellement." },
        { status: 422 }
      );
    }
    return NextResponse.json(info);
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message ?? "Ce site bloque l'extraction automatique, complète manuellement." },
      { status: 502 }
    );
  }
}
