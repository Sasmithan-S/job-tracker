import { statutInfo } from "@/lib/types";
import type { Statut } from "@/lib/types";

export default function StatusBadge({ statut }: { statut: Statut }) {
  const info = statutInfo(statut);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${info.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${info.dot} shadow-[0_0_6px_currentColor]`} />
      {info.label}
    </span>
  );
}
