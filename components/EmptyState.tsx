import { Inbox, Plus } from "lucide-react";

export default function EmptyState({ onNew, filtre }: { onNew: () => void; filtre: boolean }) {
  return (
    <div className="bg-white rounded-card border border-dashed border-gray-200 py-16 px-6 flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-2xl bg-canvas flex items-center justify-center mb-4">
        <Inbox size={24} className="text-ink-faint" />
      </div>
      <h3 className="font-display font-semibold text-ink mb-1">
        {filtre ? "Aucune candidature ne correspond" : "Aucune candidature pour l'instant"}
      </h3>
      <p className="text-sm text-ink-muted mb-5 max-w-xs">
        {filtre
          ? "Essaie d'ajuster tes filtres ou ta recherche."
          : "Colle le lien d'une offre à laquelle tu as postulé pour commencer à la suivre."}
      </p>
      {!filtre && (
        <button
          onClick={onNew}
          className="bg-navy hover:bg-navy-light text-white text-sm font-medium px-4 py-2.5 rounded-lg transition flex items-center gap-2"
        >
          <Plus size={16} />
          Ajouter ma première candidature
        </button>
      )}
    </div>
  );
}
