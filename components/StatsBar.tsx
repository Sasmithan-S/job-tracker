"use client";

import { useEffect, useRef, useState } from "react";
import { STATUTS } from "@/lib/types";
import type { Application, Statut } from "@/lib/types";

function useCountUp(target: number, duration = 600) {
  const [value, setValue] = useState(0);
  const prevTarget = useRef(0);

  useEffect(() => {
    const start = prevTarget.current;
    const diff = target - start;
    if (diff === 0) { setValue(target); return; }
    const startTime = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const p = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(start + diff * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else prevTarget.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

function StatCard({ count, label, dot, accent }: { count: number; label: string; dot?: string; accent?: boolean }) {
  const animated = useCountUp(count);
  return (
    <div
      className={`group relative rounded-card px-4 py-3.5 flex-1 min-w-[104px] overflow-hidden transition-all duration-300 ${
        accent
          ? "bg-accent text-bg shadow-glow"
          : "bg-bg-elevated border border-border hover:border-border-strong"
      }`}
    >
      <p className={`font-mono text-2xl font-bold leading-none tabular-nums ${accent ? "text-bg" : "text-content"}`}>
        {animated}
      </p>
      <p className={`text-[11px] mt-1.5 flex items-center gap-1.5 font-medium ${accent ? "text-bg/80" : "text-content-muted"}`}>
        {dot && <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />}
        {label}
      </p>
    </div>
  );
}

export default function StatsBar({ applications }: { applications: Application[] }) {
  const counts: Record<Statut, number> = {
    en_attente: 0, entretien: 0, relance: 0, refuse: 0, accepte: 0,
  };
  applications.forEach((a) => { counts[a.statut]++; });

  return (
    <div className="flex flex-wrap gap-2.5">
      <StatCard count={applications.length} label="Total" accent />
      {STATUTS.map((s) => (
        <StatCard key={s.value} count={counts[s.value]} label={s.label} dot={s.dot} />
      ))}
    </div>
  );
}
