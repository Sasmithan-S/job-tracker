"use client";

import { useState } from "react";
import type { Application, Statut } from "@/lib/types";
import { STATUTS } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import { ExternalLink, Copy, Check, MoreVertical, Pencil, Trash2, History, Hash } from "lucide-react";

interface Props {
  application: Application;
  onStatusChange: (id: string, statut: Statut) => void;
  onEdit: (application: Application) => void;
  onDelete: (id: string) => void;
  onShowHistory: (application: Application) => void;
}

function initiales(nom: string) {
  return nom
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export default function ApplicationCard({ application, onStatusChange, onEdit, onDelete, onShowHistory }: Props) {
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(application.lien);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="bg-white rounded-card border border-gray-100 shadow-card hover:shadow-card-hover transition p-5 flex flex-col gap-4 relative">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-navy/5 text-navy font-display font-bold flex items-center justify-center shrink-0 text-sm">
            {initiales(application.entreprise)}
          </div>
          <div className="min-w-0">
            <h3 className="font-display font-semibold text-ink truncate">{application.poste}</h3>
            <p className="text-sm text-ink-muted truncate">{application.entreprise}</p>
          </div>
        </div>

        <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="w-8 h-8 rounded-lg hover:bg-gray-50 flex items-center justify-center text-ink-muted"
            aria-label="Actions"
          >
            <MoreVertical size={16} />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-9 z-20 bg-white border border-gray-100 rounded-lg shadow-card-hover py-1 w-44">
                <button
                  onClick={() => { setMenuOpen(false); onEdit(application); }}
                  className="w-full text-left px-3 py-2 text-sm text-ink hover:bg-gray-50 flex items-center gap-2"
                >
                  <Pencil size={14} /> Modifier
                </button>
                <button
                  onClick={() => { setMenuOpen(false); onShowHistory(application); }}
                  className="w-full text-left px-3 py-2 text-sm text-ink hover:bg-gray-50 flex items-center gap-2"
                >
                  <History size={14} /> Historique
                </button>
                <button
                  onClick={() => { setMenuOpen(false); onDelete(application.id); }}
                  className="w-full text-left px-3 py-2 text-sm text-status-refuse hover:bg-status-refuse/5 flex items-center gap-2"
                >
                  <Trash2 size={14} /> Supprimer
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-canvas text-ink-muted border border-gray-100">
          {application.type_emploi}
        </span>
        {application.numero_reference && (
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-canvas text-ink-muted border border-gray-100 flex items-center gap-1">
            <Hash size={11} />
            {application.numero_reference}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="relative">
          <button onClick={() => setStatusMenuOpen((v) => !v)}>
            <StatusBadge statut={application.statut} />
          </button>
          {statusMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setStatusMenuOpen(false)} />
              <div className="absolute left-0 top-8 z-20 bg-white border border-gray-100 rounded-lg shadow-card-hover py-1 w-40">
                {STATUTS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => { setStatusMenuOpen(false); onStatusChange(application.id, s.value); }}
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                    {s.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <span className="text-xs text-ink-faint">{formatDate(application.date_candidature)}</span>
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
        <a
          href={application.lien}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-sm font-medium text-navy hover:text-coral flex items-center gap-1.5 truncate transition"
        >
          <ExternalLink size={14} className="shrink-0" />
          <span className="truncate">Voir l'annonce</span>
        </a>
        <button
          onClick={handleCopy}
          className="w-8 h-8 rounded-lg hover:bg-gray-50 flex items-center justify-center text-ink-muted shrink-0"
          aria-label="Copier le lien"
          title="Copier le lien"
        >
          {copied ? <Check size={14} className="text-status-accepte" /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  );
}
