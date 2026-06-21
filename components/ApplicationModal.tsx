"use client";

import { useEffect, useState } from "react";
import type { Application, Statut, TypeEmploi } from "@/lib/types";
import { STATUTS, TYPES_EMPLOI } from "@/lib/types";
import { X, Link2, Wand2, Loader2 } from "lucide-react";

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

const inputClass =
  "w-full px-3 py-2.5 rounded-lg bg-bg-inset border border-border text-content placeholder:text-content-faint text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors";

export default function ApplicationModal({ application, onClose, onSave }: Props) {
  const [form, setForm] = useState(VIDE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoFilling, setAutoFilling] = useState(false);
  const [autoFillMsg, setAutoFillMsg] = useState<string | null>(null);

  useEffect(() => {
    setAutoFillMsg(null);
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

  function capitalize(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  async function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
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

  async function handleAutoFill() {
    if (!form.lien.trim()) return;
    setAutoFilling(true);
    setAutoFillMsg(null);
    try {
      const res = await fetch("/api/applications/parse-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lien: form.lien.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Échec de l'extraction");

      const remplis: string[] = [];
      setForm((f) => {
        const next = { ...f };
        if (data.poste && !f.poste) { next.poste = data.poste; remplis.push("poste"); }
        if (data.entreprise && !f.entreprise) { next.entreprise = data.entreprise; remplis.push("entreprise"); }
        if (data.type_emploi) { next.type_emploi = data.type_emploi; remplis.push("type"); }
        if (data.numero_reference && !f.numero_reference) { next.numero_reference = data.numero_reference; remplis.push("référence"); }
        return next;
      });

      if (remplis.length === 0) {
        setAutoFillMsg("Rien de fiable à extraire ici. Complète les champs à la main.");
      } else {
        setAutoFillMsg(`Pré-rempli : ${remplis.join(", ")}. Vérifie avant d'enregistrer.`);
      }
    } catch (e: any) {
      setAutoFillMsg(e.message || "Ce site bloque l'extraction. Complète les champs à la main.");
    } finally {
      setAutoFilling(false);
    }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-bg-elevated rounded-card border border-border shadow-card-hover w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-bg-elevated rounded-t-card z-10">
          <h2 className="font-display font-semibold text-lg text-content">
            {application ? "Modifier la candidature" : "Nouvelle candidature"}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-bg-inset flex items-center justify-center text-content-muted transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-content mb-1.5 block">Lien de l'annonce *</label>
            <div className="relative">
              <Link2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-faint pointer-events-none" />
              <input
                autoFocus
                required
                type="url"
                value={form.lien}
                onPaste={handlePaste}
                onChange={(e) => setForm({ ...form, lien: e.target.value })}
                placeholder="Colle le lien de l'offre ici"
                className={`${inputClass} pl-9`}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <button
                type="button"
                onClick={handleAutoFill}
                disabled={autoFilling || !form.lien.trim()}
                className="text-xs text-accent hover:underline disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed flex items-center gap-1.5 font-medium"
              >
                {autoFilling ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                {autoFilling ? "Analyse de l'offre..." : "Remplir automatiquement"}
              </button>
            </div>
            {autoFillMsg && <p className="text-xs text-content-muted mt-1">{autoFillMsg}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-content mb-1.5 block">Poste *</label>
              <input required value={form.poste} onChange={(e) => setForm({ ...form, poste: e.target.value })}
                placeholder="Développeur Front Office" className={inputClass} />
            </div>
            <div>
              <label className="text-sm font-medium text-content mb-1.5 block">Entreprise *</label>
              <input required value={form.entreprise} onChange={(e) => setForm({ ...form, entreprise: e.target.value })}
                placeholder="Société Générale" className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-content mb-1.5 block">Type d'emploi</label>
              <select value={form.type_emploi} onChange={(e) => setForm({ ...form, type_emploi: e.target.value as TypeEmploi })}
                className={`${inputClass} cursor-pointer`}>
                {TYPES_EMPLOI.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-content mb-1.5 block">Statut</label>
              <select value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value as Statut })}
                className={`${inputClass} cursor-pointer`}>
                {STATUTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-content mb-1.5 block">
                N° de référence <span className="text-content-faint font-normal">(optionnel)</span>
              </label>
              <input value={form.numero_reference} onChange={(e) => setForm({ ...form, numero_reference: e.target.value })}
                placeholder="REF-2026-0451" className={`${inputClass} font-mono`} />
            </div>
            <div>
              <label className="text-sm font-medium text-content mb-1.5 block">Date de candidature</label>
              <input type="date" value={form.date_candidature} onChange={(e) => setForm({ ...form, date_candidature: e.target.value })}
                className={`${inputClass} font-mono`} />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-content mb-1.5 block">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
              placeholder="Contact RH, retour d'entretien..." className={`${inputClass} resize-none`} />
          </div>

          {error && <p className="text-sm text-status-refuse bg-status-refuse/10 border border-status-refuse/20 rounded-lg px-3 py-2">{error}</p>}

          <p className="text-xs text-content-faint">
            Astuce : un numéro de référence renseigné sert en priorité à repérer les réponses dans tes emails.
          </p>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium text-content-muted hover:bg-bg-inset hover:text-content transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-lg bg-accent hover:bg-accent-dark text-bg text-sm font-semibold transition-all hover:shadow-glow active:scale-95 disabled:opacity-50">
              {saving ? "Enregistrement..." : application ? "Enregistrer" : "Ajouter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
