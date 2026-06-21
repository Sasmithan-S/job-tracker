"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { STATUTS, TYPES_EMPLOI } from "@/lib/types";
import type { Statut, TypeEmploi } from "@/lib/types";

export type Tri = "date_desc" | "date_asc" | "poste_asc" | "entreprise_asc";

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  typeFiltre: TypeEmploi | "tous";
  onTypeChange: (v: TypeEmploi | "tous") => void;
  statutFiltre: Statut | "tous";
  onStatutChange: (v: Statut | "tous") => void;
  tri: Tri;
  onTriChange: (v: Tri) => void;
}

const selectClass =
  "text-sm bg-bg-inset text-content rounded-lg px-3 py-2 border border-transparent hover:border-border focus:border-accent focus:ring-1 focus:ring-accent outline-none shrink-0 cursor-pointer transition-colors appearance-none";

export default function FilterBar({
  search, onSearchChange, typeFiltre, onTypeChange, statutFiltre, onStatutChange, tri, onTriChange,
}: Props) {
  return (
    <div className="bg-bg-elevated border border-border rounded-card shadow-card p-3 flex flex-col md:flex-row gap-3 md:items-center">
      <div className="relative flex-1 min-w-[200px]">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-faint pointer-events-none" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher un poste, une entreprise..."
          className="w-full pl-9 pr-9 py-2 rounded-lg bg-bg-inset text-content placeholder:text-content-faint text-sm border border-transparent focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
        />
        {search && (
          <button onClick={() => onSearchChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-content-faint hover:text-content transition-colors">
            <X size={14} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto">
        <SlidersHorizontal size={14} className="text-content-faint shrink-0 hidden sm:block" />

        <select value={typeFiltre} onChange={(e) => onTypeChange(e.target.value as TypeEmploi | "tous")} className={selectClass}>
          <option value="tous">Tous les types</option>
          {TYPES_EMPLOI.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>

        <select value={statutFiltre} onChange={(e) => onStatutChange(e.target.value as Statut | "tous")} className={selectClass}>
          <option value="tous">Tous les statuts</option>
          {STATUTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        <select value={tri} onChange={(e) => onTriChange(e.target.value as Tri)} className={selectClass}>
          <option value="date_desc">Plus récentes</option>
          <option value="date_asc">Plus anciennes</option>
          <option value="poste_asc">Poste (A-Z)</option>
          <option value="entreprise_asc">Entreprise (A-Z)</option>
        </select>
      </div>
    </div>
  );
}
