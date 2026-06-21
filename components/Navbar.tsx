"use client";

import { Briefcase, LogOut, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  userEmail: string;
  onNewApplication: () => void;
}

export default function Navbar({ userEmail, onNewApplication }: Props) {
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <header className="bg-navy text-white sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-coral flex items-center justify-center shrink-0">
            <Briefcase size={16} className="text-white" />
          </div>
          <span className="font-display font-bold hidden sm:block">Candidatures</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onNewApplication}
            className="bg-coral hover:bg-coral-dark text-white text-sm font-medium px-3.5 py-2 rounded-lg transition flex items-center gap-1.5"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Nouvelle candidature</span>
          </button>
          <div className="hidden md:block text-sm text-white/70 truncate max-w-[160px]">{userEmail}</div>
          <button
            onClick={handleLogout}
            className="w-9 h-9 rounded-lg hover:bg-white/10 flex items-center justify-center transition"
            title="Se déconnecter"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
