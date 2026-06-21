"use client";

import { Activity, LogOut, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ThemeToggle from "@/components/ThemeToggle";

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
    <header className="sticky top-0 z-30 bg-bg/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0 shadow-glow">
            <Activity size={16} className="text-bg" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display font-bold text-content text-[15px] tracking-tight">Candidatures</span>
            <span className="font-mono text-[9px] text-content-faint tracking-widest uppercase mt-0.5">tracker</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            onClick={onNewApplication}
            className="bg-accent hover:bg-accent-dark text-bg text-sm font-semibold px-3.5 py-2 rounded-lg transition-all duration-200 flex items-center gap-1.5 hover:shadow-glow active:scale-95"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span className="hidden sm:inline">Nouvelle candidature</span>
          </button>
          <ThemeToggle />
          <div className="hidden md:flex items-center gap-2 pl-1">
            <div className="w-7 h-7 rounded-full bg-bg-inset border border-border flex items-center justify-center text-[11px] font-mono font-semibold text-content-muted uppercase">
              {userEmail.charAt(0)}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-9 h-9 rounded-lg border border-transparent hover:border-border hover:bg-bg-elevated flex items-center justify-center text-content-faint hover:text-content transition-all"
            title="Se déconnecter"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
