"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Activity, Lock, ArrowRight } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

const inputClass =
  "w-full pl-9 pr-3 py-2.5 rounded-lg bg-bg-inset border border-border text-content placeholder:text-content-faint text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    async function init() {
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setError("Lien de réinitialisation invalide ou expiré. Refais une demande depuis la page de connexion.");
          return;
        }
      }
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setError("Lien de réinitialisation invalide ou expiré. Refais une demande depuis la page de connexion.");
        return;
      }
      setReady(true);
    }
    init();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) { setError("6 caractères minimum."); return; }
    if (password !== confirm) { setError("Les deux mots de passe ne correspondent pas."); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setDone(true);
    setTimeout(() => { window.location.href = "/dashboard"; }, 1500);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-bg relative">
      <div className="absolute top-5 right-5"><ThemeToggle /></div>
      <div className="w-full max-w-sm animate-fade-in-up">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center shadow-glow">
            <Activity size={18} className="text-bg" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-lg text-content">Candidatures</span>
        </div>

        <div className="bg-bg-elevated rounded-card border border-border shadow-card p-8">
          <h2 className="font-display font-bold text-2xl text-content mb-1 tracking-tight">Nouveau mot de passe</h2>
          <p className="text-content-muted text-sm mb-6">Choisis un nouveau mot de passe pour ton compte.</p>

          {done ? (
            <p className="text-sm text-status-accepte bg-status-accepte/10 border border-status-accepte/20 rounded-lg px-3 py-2">
              Mot de passe mis à jour. Redirection...
            </p>
          ) : !ready ? (
            <p className="text-sm text-content-muted">{error ?? "Vérification du lien..."}</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-content mb-1.5 block">Nouveau mot de passe</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-faint pointer-events-none" />
                  <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={inputClass} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-content mb-1.5 block">Confirmer</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-faint pointer-events-none" />
                  <input type="password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" className={inputClass} />
                </div>
              </div>

              {error && <p className="text-sm text-status-refuse bg-status-refuse/10 border border-status-refuse/20 rounded-lg px-3 py-2">{error}</p>}

              <button type="submit" disabled={loading}
                className="w-full bg-accent hover:bg-accent-dark text-bg font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all hover:shadow-glow active:scale-95 disabled:opacity-50">
                {loading ? "..." : "Mettre à jour"}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
