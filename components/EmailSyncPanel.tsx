"use client";

import { useState } from "react";
import { Mail, RefreshCw, Unlink, Sparkles } from "lucide-react";
import type { EmailConnection } from "@/lib/types";

interface Props {
  connection: EmailConnection | null;
  onSynced: () => void;
}

function formatRelative(iso: string | null) {
  if (!iso) return "Jamais synchronisé";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.round(hours / 24);
  return `Il y a ${days} j`;
}

export default function EmailSyncPanel({ connection, onSynced }: Props) {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  async function handleSync() {
    setSyncing(true);
    setResult(null);
    try {
      const res = await fetch("/api/gmail/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(`${data.candidaturesMisesAJour} mise(s) à jour sur ${data.emailsAnalyses} email(s) analysé(s).`);
      onSynced();
    } catch (e: any) {
      setResult(`Erreur : ${e.message}`);
    } finally {
      setSyncing(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm("Déconnecter Gmail ? La mise à jour automatique des statuts s'arrêtera.")) return;
    await fetch("/api/gmail/disconnect", { method: "POST" });
    window.location.reload();
  }

  if (!connection) {
    return (
      <div className="relative bg-bg-elevated rounded-card border border-border p-4 flex items-center gap-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-accent-soft to-transparent opacity-50 pointer-events-none" />
        <div className="relative w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0 border border-accent/20">
          <Sparkles size={18} />
        </div>
        <div className="relative flex-1 min-w-0">
          <p className="font-semibold text-content text-sm">Mets à jour tes statuts automatiquement</p>
          <p className="text-xs text-content-muted">Connecte Gmail : on repère les réponses (refus, entretien, embauche) et on met à jour le statut tout seul.</p>
        </div>
        <button
          onClick={() => { setConnecting(true); window.location.href = "/api/gmail/connect"; }}
          disabled={connecting}
          className="relative shrink-0 bg-accent hover:bg-accent-dark text-bg text-sm font-semibold px-4 py-2 rounded-lg transition-all hover:shadow-glow active:scale-95 disabled:opacity-50"
        >
          Connecter Gmail
        </button>
      </div>
    );
  }

  return (
    <div className="bg-bg-elevated rounded-card border border-border p-4 flex items-center gap-4 flex-wrap">
      <div className="w-10 h-10 rounded-xl bg-status-accepte/15 text-status-accepte flex items-center justify-center shrink-0 border border-status-accepte/20">
        <Mail size={18} />
      </div>
      <div className="flex-1 min-w-[180px]">
        <p className="font-medium text-content text-sm flex items-center gap-2">
          {connection.google_email}
          <span className="w-1.5 h-1.5 rounded-full bg-status-accepte shadow-[0_0_6px_currentColor]" />
        </p>
        <p className="font-mono text-xs text-content-muted">{result ?? formatRelative(connection.last_sync_at)}</p>
      </div>
      <button
        onClick={handleSync}
        disabled={syncing}
        className="shrink-0 bg-bg-inset hover:bg-bg-inset/70 border border-border text-content text-sm font-medium px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
      >
        <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
        {syncing ? "Synchronisation..." : "Synchroniser"}
      </button>
      <button
        onClick={handleDisconnect}
        className="shrink-0 w-9 h-9 rounded-lg hover:bg-status-refuse/10 text-content-faint hover:text-status-refuse flex items-center justify-center transition-colors"
        title="Déconnecter Gmail"
      >
        <Unlink size={15} />
      </button>
    </div>
  );
}
