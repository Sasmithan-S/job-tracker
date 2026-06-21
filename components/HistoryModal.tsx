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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-bg-elevated rounded-card border border-border shadow-card-hover w-full max-w-md max-h-[80vh] overflow-y-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-bg-elevated rounded-t-card z-10">
          <div>
            <h2 className="font-display font-semibold text-content">Historique</h2>
            <p className="text-xs text-content-muted">{application.poste} — {application.entreprise}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-bg-inset flex items-center justify-center text-content-muted transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {entries === null && (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => <div key={i} className="h-12 rounded-lg skeleton" />)}
            </div>
          )}
          {entries?.length === 0 && <p className="text-sm text-content-muted">Aucun historique pour le moment.</p>}

          <ol className="relative space-y-5">
            {entries && entries.length > 0 && (
              <div className="absolute left-[13px] top-2 bottom-2 w-px bg-border" />
            )}
            {entries?.map((entry) => (
              <li key={entry.id} className="relative flex gap-3">
                <div className="shrink-0 z-10">
                  {entry.source === "email_auto" ? (
                    <div className="w-7 h-7 rounded-full bg-accent/15 text-accent flex items-center justify-center border-2 border-bg-elevated"><Mail size={12} /></div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-bg-inset text-content-muted flex items-center justify-center border-2 border-bg-elevated"><User size={12} /></div>
                  )}
                </div>
                <div className="min-w-0 pt-0.5">
                  <p className="text-sm text-content">
                    {entry.ancien_statut && (
                      <span className="text-content-muted">{statutInfo(entry.ancien_statut).label} → </span>
                    )}
                    <span className="font-medium">{statutInfo(entry.nouveau_statut).label}</span>
                  </p>
                  <p className="font-mono text-[11px] text-content-faint mt-0.5">
                    {entry.source === "email_auto" ? "Auto · email" : "Manuel"}
                    {" · "}
                    {new Date(entry.created_at).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                  {entry.email_extrait && (
                    <p className="text-xs text-content-muted bg-bg-inset border border-border rounded-lg px-2.5 py-1.5 mt-1.5 italic line-clamp-2">
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
