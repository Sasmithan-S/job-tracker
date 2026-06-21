"use client";

import { useEffect, useMemo, useState } from "react";
import type { Application, EmailConnection, Statut, TypeEmploi } from "@/lib/types";
import Navbar from "@/components/Navbar";
import StatsBar from "@/components/StatsBar";
import FilterBar, { Tri } from "@/components/FilterBar";
import ApplicationCard from "@/components/ApplicationCard";
import ApplicationModal from "@/components/ApplicationModal";
import HistoryModal from "@/components/HistoryModal";
import EmailSyncPanel from "@/components/EmailSyncPanel";
import EmptyState from "@/components/EmptyState";

interface Props {
  initialApplications: Application[];
  initialEmailConnection: EmailConnection | null;
  userEmail: string;
}

export default function DashboardClient({ initialApplications, initialEmailConnection, userEmail }: Props) {
  const [applications, setApplications] = useState<Application[]>(initialApplications);
  const [emailConnection, setEmailConnection] = useState<EmailConnection | null>(initialEmailConnection);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Application | null>(null);
  const [historyTarget, setHistoryTarget] = useState<Application | null>(null);

  const [search, setSearch] = useState("");
  const [typeFiltre, setTypeFiltre] = useState<TypeEmploi | "tous">("tous");
  const [statutFiltre, setStatutFiltre] = useState<Statut | "tous">("tous");
  const [tri, setTri] = useState<Tri>("date_desc");

  const [gmailError, setGmailError] = useState<string | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("gmail_error");
    if (err) setGmailError(err);
  }, []);

  const filtered = useMemo(() => {
    let list = [...applications];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((a) => a.poste.toLowerCase().includes(q) || a.entreprise.toLowerCase().includes(q));
    }
    if (typeFiltre !== "tous") list = list.filter((a) => a.type_emploi === typeFiltre);
    if (statutFiltre !== "tous") list = list.filter((a) => a.statut === statutFiltre);

    list.sort((a, b) => {
      switch (tri) {
        case "date_asc": return a.date_candidature.localeCompare(b.date_candidature);
        case "poste_asc": return a.poste.localeCompare(b.poste);
        case "entreprise_asc": return a.entreprise.localeCompare(b.entreprise);
        default: return b.date_candidature.localeCompare(a.date_candidature);
      }
    });

    return list;
  }, [applications, search, typeFiltre, statutFiltre, tri]);

  async function handleSave(data: Partial<Application>, id?: string) {
    if (id) {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error);
      setApplications((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } else {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const created = await res.json();
      if (!res.ok) throw new Error(created.error);
      setApplications((prev) => [created, ...prev]);
    }
  }

  async function handleStatusChange(id: string, statut: Statut) {
    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, statut } : a)));
    const res = await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut }),
    });
    if (!res.ok) {
      // rollback silencieux en cas d'échec réseau
      setApplications(initialApplications);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette candidature ?")) return;
    setApplications((prev) => prev.filter((a) => a.id !== id));
    await fetch(`/api/applications/${id}`, { method: "DELETE" });
  }


  return (
    <div className="min-h-screen bg-bg">
      <Navbar userEmail={userEmail} onNewApplication={() => { setEditing(null); setModalOpen(true); }} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {gmailError && (
          <div className="bg-status-refuse/10 border border-status-refuse/20 text-status-refuse text-sm rounded-lg px-4 py-2.5 animate-fade-in">
            Connexion Gmail impossible ({gmailError}). Réessaie depuis le panneau ci-dessous.
          </div>
        )}

        <div className="animate-fade-in-up">
          <h1 className="font-display font-bold text-2xl text-content tracking-tight">Mes candidatures</h1>
          <p className="text-sm text-content-muted mt-0.5">Colle un lien, suis ton statut, laisse l'email faire le reste.</p>
        </div>

        <EmailSyncPanel connection={emailConnection} onSynced={() => window.location.reload()} />

        <StatsBar applications={applications} />

        <FilterBar
          search={search} onSearchChange={setSearch}
          typeFiltre={typeFiltre} onTypeChange={setTypeFiltre}
          statutFiltre={statutFiltre} onStatutChange={setStatutFiltre}
          tri={tri} onTriChange={setTri}
        />

        {filtered.length === 0 ? (
          <EmptyState onNew={() => { setEditing(null); setModalOpen(true); }} filtre={applications.length > 0} />
        ) : (
          <div key={`${search}-${typeFiltre}-${statutFiltre}-${tri}`} className="stagger grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((app) => (
              <ApplicationCard
                key={app.id}
                application={app}
                onStatusChange={handleStatusChange}
                onEdit={(a) => { setEditing(a); setModalOpen(true); }}
                onDelete={handleDelete}
                onShowHistory={setHistoryTarget}
              />
            ))}
          </div>
        )}
      </main>

      {modalOpen && (
        <ApplicationModal
          application={editing}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />
      )}

      {historyTarget && (
        <HistoryModal application={historyTarget} onClose={() => setHistoryTarget(null)} />
      )}
    </div>
  );
}
