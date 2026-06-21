import { classifyEmailStatus, normalize } from "@/lib/emailClassifier";
import { getMessage, listRecentMessageIds, refreshAccessToken } from "@/lib/gmail";
import type { Application, Statut } from "@/lib/types";

interface SyncResult {
  emailsAnalyses: number;
  candidaturesMisesAJour: number;
  erreurs: string[];
}

// supabase : client service_role (admin) ou client de session, peu importe
// tant qu'il a les droits de lecture/écriture sur les candidatures de userId.
export async function syncUserMailbox(
  supabase: any,
  userId: string,
  refreshToken: string,
  lastSyncAt: string | null
): Promise<SyncResult> {
  const result: SyncResult = { emailsAnalyses: 0, candidaturesMisesAJour: 0, erreurs: [] };

  // 1. Token d'accès frais
  const { access_token } = await refreshAccessToken(refreshToken);

  // 2. Fenêtre temporelle : depuis le dernier sync, ou 30 jours par défaut
  const defaultSince = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
  const since = lastSyncAt ? Math.floor(new Date(lastSyncAt).getTime() / 1000) : defaultSince;

  // 3. Candidatures de l'utilisateur (pour le matching)
  const { data: applications, error: appsError } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", userId);

  if (appsError) {
    result.erreurs.push(`Lecture candidatures: ${appsError.message}`);
    return result;
  }
  if (!applications || applications.length === 0) return result;

  // 4. Liste des emails récents
  let messageIds: string[] = [];
  try {
    messageIds = await listRecentMessageIds(access_token, since);
  } catch (e: any) {
    result.erreurs.push(`Liste emails: ${e.message}`);
    return result;
  }

  // 5. Analyse de chaque email
  for (const id of messageIds) {
    let email;
    try {
      email = await getMessage(access_token, id);
    } catch {
      continue;
    }
    if (!email) continue;
    result.emailsAnalyses++;

    const haystack = normalize(`${email.subject} ${email.from} ${email.bodyText} ${email.snippet}`);

    const match = findMatchingApplication(applications as Application[], haystack);
    if (!match) continue;

    const detectedStatus = classifyEmailStatus(`${email.subject} ${email.bodyText} ${email.snippet}`);
    if (!detectedStatus) continue;
    if (detectedStatus === match.statut) continue;

    // 6. Mise à jour du statut + historique
    const { error: updateError } = await supabase
      .from("applications")
      .update({ statut: detectedStatus })
      .eq("id", match.id);

    if (updateError) {
      result.erreurs.push(`Maj candidature ${match.id}: ${updateError.message}`);
      continue;
    }

    await supabase.from("status_history").insert({
      application_id: match.id,
      ancien_statut: match.statut,
      nouveau_statut: detectedStatus,
      source: "email_auto",
      email_extrait: `${email.subject} — ${email.snippet}`.slice(0, 500),
    });

    result.candidaturesMisesAJour++;
  }

  return result;
}

function findMatchingApplication(applications: Application[], haystack: string): Application | null {
  // Priorité 1 : numéro de référence (le plus fiable)
  for (const app of applications) {
    if (app.numero_reference && app.numero_reference.trim().length >= 3) {
      const ref = normalize(app.numero_reference.trim());
      if (haystack.includes(ref)) return app;
    }
  }
  // Priorité 2 : nom de l'entreprise
  for (const app of applications) {
    const entreprise = normalize(app.entreprise.trim());
    if (entreprise.length >= 3 && haystack.includes(entreprise)) return app;
  }
  return null;
}
