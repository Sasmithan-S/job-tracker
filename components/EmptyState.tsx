import { Inbox, Plus } from "lucide-react";

export default function EmptyState({ onNew, filtre }: { onNew: () => void; filtre: boolean }) {
  return (
    <div className="bg-bg-elevated rounded-card border border-dashed border-border-strong py-16 px-6 flex flex-col items-center text-center animate-fade-in">
      <div className="w-14 h-14 rounded-2xl bg-bg-inset border border-border flex items-center justify-center mb-4">
        <Inbox size={24} className="text-content-faint" />
      </div>
      <h3 className="font-display font-semibold text-content mb-1">
        {filtre ? "Aucune candidature ne correspond" : "Aucune candidature pour l'instant"}
      </h3>
      <p className="text-sm text-content-muted mb-5 max-w-xs">
        {filtre
          ? "Essaie d'ajuster tes filtres ou ta recherche."
          : "Colle le lien d'une offre à laquelle tu as postulé pour commencer à la suivre."}
      </p>
      {!filtre && (
        <button onClick={onNew}
          className="bg-accent hover:bg-accent-dark text-bg text-sm font-semibold px-4 py-2.5 rounded-lg transition-all hover:shadow-glow active:scale-95 flex items-center gap-2">
          <Plus size={16} strokeWidth={2.5} />
          Ajouter ma première candidature
        </button>
      )}
    </div>
  );
}
