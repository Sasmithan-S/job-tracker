"use client";

import { useState } from "react";
import type { Application, Statut } from "@/lib/types";
import { STATUTS } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import { ExternalLink, Copy, Check, MoreVertical, Pencil, Trash2, History, Hash, ChevronDown } from "lucide-react";

interface Props {
  application: Application;
  onStatusChange: (id: string, statut: Statut) => void;
  onEdit: (application: Application) => void;
  onDelete: (id: string) => void;
  onShowHistory: (application: Application) => void;
}

function initiales(nom: string) {
  return nom.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
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
    <div className="group relative bg-bg-elevated rounded-card border border-border hover:border-border-strong shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 p-5 flex flex-col gap-4">
      {/* Liseré d'accent qui apparaît au hover */}
      <div className="absolute left-0 top-5 bottom-5 w-[3px] rounded-full bg-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-bg-inset border border-border text-content font-display font-bold flex items-center justify-center shrink-0 text-sm group-hover:border-accent/40 transition-colors">
            {initiales(application.entreprise)}
          </div>
          <div className="min-w-0">
            <h3 className="font-display font-semibold text-content truncate leading-snug">{application.poste}</h3>
            <p className="text-sm text-content-muted truncate">{application.entreprise}</p>
          </div>
        </div>

        <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="w-8 h-8 rounded-lg hover:bg-bg-inset flex items-center justify-center text-content-faint hover:text-content transition-colors"
            aria-label="Actions"
          >
            <MoreVertical size={16} />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-9 z-20 bg-bg-elevated border border-border rounded-xl shadow-card-hover py-1 w-44 animate-scale-in origin-top-right">
                <button onClick={() => { setMenuOpen(false); onEdit(application); }}
                  className="w-full text-left px-3 py-2 text-sm text-content hover:bg-bg-inset flex items-center gap-2 transition-colors">
                  <Pencil size={14} /> Modifier
                </button>
                <button onClick={() => { setMenuOpen(false); onShowHistory(application); }}
                  className="w-full text-left px-3 py-2 text-sm text-content hover:bg-bg-inset flex items-center gap-2 transition-colors">
                  <History size={14} /> Historique
                </button>
                <div className="h-px bg-border my-1" />
                <button onClick={() => { setMenuOpen(false); onDelete(application.id); }}
                  className="w-full text-left px-3 py-2 text-sm text-status-refuse hover:bg-status-refuse/10 flex items-center gap-2 transition-colors">
                  <Trash2 size={14} /> Supprimer
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[11px] font-medium px-2 py-1 rounded-md bg-bg-inset text-content-muted border border-border uppercase tracking-wide">
          {application.type_emploi}
        </span>
        {application.numero_reference && (
          <span className="font-mono text-[11px] font-medium px-2 py-1 rounded-md bg-bg-inset text-content-muted border border-border flex items-center gap-1">
            <Hash size={10} />
            {application.numero_reference}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="relative">
          <button onClick={() => setStatusMenuOpen((v) => !v)} className="flex items-center gap-1 group/status">
            <StatusBadge statut={application.statut} />
            <ChevronDown size={12} className="text-content-faint group-hover/status:text-content transition-colors" />
          </button>
          {statusMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setStatusMenuOpen(false)} />
              <div className="absolute left-0 top-9 z-20 bg-bg-elevated border border-border rounded-xl shadow-card-hover py-1 w-40 animate-scale-in origin-top-left">
                {STATUTS.map((s) => (
                  <button key={s.value}
                    onClick={() => { setStatusMenuOpen(false); onStatusChange(application.id, s.value); }}
                    className={`w-full text-left px-3 py-1.5 text-sm hover:bg-bg-inset flex items-center gap-2 transition-colors ${s.value === application.statut ? "text-content font-medium" : "text-content-muted"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                    {s.label}
                    {s.value === application.statut && <Check size={12} className="ml-auto text-accent" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <span className="font-mono text-[11px] text-content-faint tabular-nums">{formatDate(application.date_candidature)}</span>
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-border">
        <a href={application.lien} target="_blank" rel="noopener noreferrer"
          className="flex-1 text-sm font-medium text-content-muted hover:text-accent flex items-center gap-1.5 truncate transition-colors">
          <ExternalLink size={14} className="shrink-0" />
          <span className="truncate">Voir l'annonce</span>
        </a>
        <button onClick={handleCopy}
          className="w-8 h-8 rounded-lg hover:bg-bg-inset flex items-center justify-center text-content-faint hover:text-content shrink-0 transition-colors"
          aria-label="Copier le lien" title="Copier le lien">
          {copied ? <Check size={14} className="text-accent" /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  );
}
