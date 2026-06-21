import { STATUTS } from "@/lib/types";
import type { Application, Statut } from "@/lib/types";

export default function StatsBar({ applications }: { applications: Application[] }) {
  const counts: Record<Statut, number> = {
    en_attente: 0, entretien: 0, relance: 0, refuse: 0, accepte: 0,
  };
  applications.forEach((a) => { counts[a.statut]++; });

  return (
    <div className="flex flex-wrap gap-2.5">
      <div className="bg-navy text-white rounded-card px-4 py-3 flex-1 min-w-[110px]">
        <p className="text-2xl font-display font-bold leading-none">{applications.length}</p>
        <p className="text-xs text-white/70 mt-1">Total</p>
      </div>
      {STATUTS.map((s) => (
        <div key={s.value} className="bg-white border border-gray-100 rounded-card px-4 py-3 flex-1 min-w-[110px]">
          <p className="text-2xl font-display font-bold leading-none text-ink">{counts[s.value]}</p>
          <p className="text-xs text-ink-muted mt-1 flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {s.label}
          </p>
        </div>
      ))}
    </div>
  );
}
