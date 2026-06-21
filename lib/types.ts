export type TypeEmploi = "CDI" | "CDD" | "Stage" | "Alternance" | "Freelance" | "Intérim";

export type Statut = "en_attente" | "entretien" | "relance" | "refuse" | "accepte";

export interface Application {
  id: string;
  user_id: string;
  poste: string;
  entreprise: string;
  lien: string;
  type_emploi: TypeEmploi;
  statut: Statut;
  numero_reference: string | null;
  date_candidature: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface StatusHistoryEntry {
  id: string;
  application_id: string;
  ancien_statut: Statut | null;
  nouveau_statut: Statut;
  source: "manuel" | "email_auto";
  email_extrait: string | null;
  created_at: string;
}

export interface EmailConnection {
  id: string;
  user_id: string;
  google_email: string;
  last_sync_at: string | null;
}

export const TYPES_EMPLOI: TypeEmploi[] = ["CDI", "CDD", "Stage", "Alternance", "Freelance", "Intérim"];

export const STATUTS: { value: Statut; label: string; color: string; dot: string }[] = [
  { value: "en_attente", label: "En attente", color: "bg-status-attente/10 text-status-attente border-status-attente/30", dot: "bg-status-attente" },
  { value: "entretien", label: "Entretien", color: "bg-status-entretien/10 text-status-entretien border-status-entretien/30", dot: "bg-status-entretien" },
  { value: "relance", label: "À relancer", color: "bg-status-relance/10 text-status-relance border-status-relance/30", dot: "bg-status-relance" },
  { value: "refuse", label: "Refusé", color: "bg-status-refuse/10 text-status-refuse border-status-refuse/30", dot: "bg-status-refuse" },
  { value: "accepte", label: "Accepté", color: "bg-status-accepte/10 text-status-accepte border-status-accepte/30", dot: "bg-status-accepte" },
];

export function statutInfo(statut: Statut) {
  return STATUTS.find((s) => s.value === statut) ?? STATUTS[0];
}
