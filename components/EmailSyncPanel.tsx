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
      setResult(`${data.candidaturesMisesAJour} candidature(s) mise(s) à jour sur ${data.emailsAnalyses} email(s) analysé(s).`);
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
      <div className="bg-white rounded-card border border-dashed border-gray-200 p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-coral/10 text-coral flex items-center justify-center shrink-0">
          <Sparkles size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-ink text-sm">Mets à jour tes statuts automatiquement</p>
          <p className="text-xs text-ink-muted">Connecte ta boîte Gmail : on repère les réponses (refus, entretien, embauche) et on met à jour le statut tout seul.</p>
        </div>
        <button
          onClick={() => { setConnecting(true); window.location.href = "/api/gmail/connect"; }}
          disabled={connecting}
          className="shrink-0 bg-navy hover:bg-navy-light text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
        >
          Connecter Gmail
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-card border border-gray-100 p-4 flex items-center gap-4 flex-wrap">
      <div className="w-10 h-10 rounded-xl bg-status-accepte/10 text-status-accepte flex items-center justify-center shrink-0">
        <Mail size={18} />
      </div>
      <div className="flex-1 min-w-[180px]">
        <p className="font-medium text-ink text-sm">{connection.google_email}</p>
        <p className="text-xs text-ink-muted">{result ?? formatRelative(connection.last_sync_at)}</p>
      </div>
      <button
        onClick={handleSync}
        disabled={syncing}
        className="shrink-0 bg-canvas hover:bg-gray-100 text-ink text-sm font-medium px-3.5 py-2 rounded-lg transition flex items-center gap-2 disabled:opacity-50"
      >
        <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
        {syncing ? "Synchronisation..." : "Synchroniser maintenant"}
      </button>
      <button
        onClick={handleDisconnect}
        className="shrink-0 w-9 h-9 rounded-lg hover:bg-status-refuse/5 text-ink-faint hover:text-status-refuse flex items-center justify-center transition"
        title="Déconnecter Gmail"
      >
        <Unlink size={15} />
      </button>
    </div>
  );
}
