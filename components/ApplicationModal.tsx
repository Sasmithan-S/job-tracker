"use client";

import { useEffect, useState } from "react";
import type { Application, Statut, TypeEmploi } from "@/lib/types";
import { STATUTS, TYPES_EMPLOI } from "@/lib/types";
import { X, Link2 } from "lucide-react";

interface Props {
  application: Application | null;
  onClose: () => void;
  onSave: (data: Partial<Application>, id?: string) => Promise<void>;
}

const VIDE = {
  lien: "",
  poste: "",
  entreprise: "",
  type_emploi: "CDI" as TypeEmploi,
  statut: "en_attente" as Statut,
  numero_reference: "",
  date_candidature: new Date().toISOString().slice(0, 10),
  notes: "",
};

export default function ApplicationModal({ application, onClose, onSave }: Props) {
  const [form, setForm] = useState(VIDE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (application) {
      setForm({
        lien: application.lien,
        poste: application.poste,
        entreprise: application.entreprise,
        type_emploi: application.type_emploi,
        statut: application.statut,
        numero_reference: application.numero_reference ?? "",
        date_candidature: application.date_candidature.slice(0, 10),
        notes: application.notes ?? "",
      });
    } else {
      setForm(VIDE);
    }
  }, [application]);

  async function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    // Pré-remplit le nom d'entreprise depuis le domaine du lien collé, si vide
    const pasted = e.clipboardData.getData("text");
    if (!form.entreprise && pasted.startsWith("http")) {
      try {
        const host = new URL(pasted).hostname.replace("www.", "").split(".")[0];
        setForm((f) => ({ ...f, entreprise: f.entreprise || capitalize(host) }));
      } catch {
        /* ignore */
      }
    }
  }

  function capitalize(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.lien.trim() || !form.poste.trim() || !form.entreprise.trim()) {
      setError("Lien, poste et entreprise sont requis.");
      return;
    }
    setSaving(true);
    try {
      await onSave(
        { ...form, numero_reference: form.numero_reference || null, notes: form.notes || null },
        application?.id
      );
      onClose();
    } catch (err: any) {
      setError(err.message ?? "Une erreur est survenue.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-card shadow-card-hover w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-card">
          <h2 className="font-display font-semibold text-lg text-ink">
            {application ? "Modifier la candidature" : "Nouvelle candidature"}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-50 flex items-center justify-center text-ink-muted">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-ink mb-1.5 block">Lien de l'annonce *</label>
            <div className="relative">
              <Link2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
              <input
                autoFocus
                required
                type="url"
                value={form.lien}
                onPaste={handlePaste}
                onChange={(e) => setForm({ ...form, lien: e.target.value })}
                placeholder="Colle le lien de l'offre ici"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-coral focus:ring-1 focus:ring-coral outline-none transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-ink mb-1.5 block">Poste *</label>
              <input
                required
                value={form.poste}
                onChange={(e) => setForm({ ...form, poste: e.target.value })}
                placeholder="Développeur Front Office"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-coral focus:ring-1 focus:ring-coral outline-none transition"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-ink mb-1.5 block">Entreprise *</label>
              <input
                required
                value={form.entreprise}
                onChange={(e) => setForm({ ...form, entreprise: e.target.value })}
                placeholder="Société Générale"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-coral focus:ring-1 focus:ring-coral outline-none transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-ink mb-1.5 block">Type d'emploi</label>
              <select
                value={form.type_emploi}
                onChange={(e) => setForm({ ...form, type_emploi: e.target.value as TypeEmploi })}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-coral focus:ring-1 focus:ring-coral outline-none transition"
              >
                {TYPES_EMPLOI.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-ink mb-1.5 block">Statut</label>
              <select
                value={form.statut}
                onChange={(e) => setForm({ ...form, statut: e.target.value as Statut })}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-coral focus:ring-1 focus:ring-coral outline-none transition"
              >
                {STATUTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-ink mb-1.5 block">
                N° de référence
                <span className="text-ink-faint font-normal"> (optionnel)</span>
              </label>
              <input
                value={form.numero_reference}
                onChange={(e) => setForm({ ...form, numero_reference: e.target.value })}
                placeholder="REF-2026-0451"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-coral focus:ring-1 focus:ring-coral outline-none transition"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-ink mb-1.5 block">Date de candidature</label>
              <input
                type="date"
                value={form.date_candidature}
                onChange={(e) => setForm({ ...form, date_candidature: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-coral focus:ring-1 focus:ring-coral outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-ink mb-1.5 block">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              placeholder="Contact RH, retour d'entretien..."
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-coral focus:ring-1 focus:ring-coral outline-none transition resize-none"
            />
          </div>

          {error && <p className="text-sm text-status-refuse bg-status-refuse/5 border border-status-refuse/20 rounded-lg px-3 py-2">{error}</p>}

          <p className="text-xs text-ink-faint">
            Astuce : si tu as renseigné un numéro de référence, la synchronisation email s'en sert en priorité pour repérer les réponses.
          </p>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-ink-muted hover:bg-gray-50 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-lg bg-navy hover:bg-navy-light text-white text-sm font-medium transition disabled:opacity-50"
            >
              {saving ? "Enregistrement..." : application ? "Enregistrer" : "Ajouter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
