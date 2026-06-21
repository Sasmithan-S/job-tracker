"use client";

import { useEffect, useState } from "react";
import { X, Mail, User } from "lucide-react";
import type { Application, StatusHistoryEntry } from "@/lib/types";
import { statutInfo } from "@/lib/types";

export default function HistoryModal({ application, onClose }: { application: Application; onClose: () => void }) {
  const [entries, setEntries] = useState<StatusHistoryEntry[] | null>(null);

  useEffect(() => {
    fetch(`/api/applications/${application.id}/history`)
      .then((r) => r.json())
      .then(setEntries)
      .catch(() => setEntries([]));
  }, [application.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-card shadow-card-hover w-full max-w-md max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-card">
          <div>
            <h2 className="font-display font-semibold text-ink">Historique</h2>
            <p className="text-xs text-ink-muted">{application.poste} — {application.entreprise}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-50 flex items-center justify-center text-ink-muted">
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {entries === null && <p className="text-sm text-ink-muted">Chargement...</p>}
          {entries?.length === 0 && <p className="text-sm text-ink-muted">Aucun historique pour le moment.</p>}

          <ol className="space-y-4">
            {entries?.map((entry) => (
              <li key={entry.id} className="flex gap-3">
                <div className="shrink-0 mt-0.5">
                  {entry.source === "email_auto" ? (
                    <div className="w-7 h-7 rounded-full bg-coral/10 text-coral flex items-center justify-center"><Mail size={13} /></div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-navy/10 text-navy flex items-center justify-center"><User size={13} /></div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-ink">
                    {entry.ancien_statut && (
                      <span className="text-ink-muted">{statutInfo(entry.ancien_statut).label} → </span>
                    )}
                    <span className="font-medium">{statutInfo(entry.nouveau_statut).label}</span>
                  </p>
                  <p className="text-xs text-ink-faint mt-0.5">
                    {entry.source === "email_auto" ? "Détecté automatiquement depuis un email" : "Modifié manuellement"}
                    {" · "}
                    {new Date(entry.created_at).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                  {entry.email_extrait && (
                    <p className="text-xs text-ink-muted bg-canvas rounded-lg px-2.5 py-1.5 mt-1.5 italic line-clamp-2">
                      « {entry.email_extrait} »
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
