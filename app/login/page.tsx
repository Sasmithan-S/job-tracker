"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Briefcase, Mail, Lock, ArrowRight, CheckCircle2 } from "lucide-react";

type Mode = "connexion" | "inscription" | "oubli";

export default function LoginPage() {
  const supabase = createClient();
  const [mode, setMode] = useState<Mode>("connexion");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    if (mode === "oubli") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) setError(error.message);
      else setMessage("Si ce compte existe, un email avec un lien de réinitialisation vient d'être envoyé.");
      setLoading(false);
      return;
    }

    if (mode === "inscription") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) setError(error.message);
      else setMessage("Compte créé. Vérifie ta boîte mail pour confirmer ton adresse.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else window.location.href = "/dashboard";
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex">
      {/* Panneau de marque */}
      <div className="hidden lg:flex lg:w-5/12 bg-navy text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-coral/10" />
        <div className="absolute -left-16 bottom-0 w-72 h-72 rounded-full bg-white/5" />

        <div className="relative z-10 flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-coral flex items-center justify-center">
            <Briefcase size={18} className="text-white" />
          </div>
          <span className="font-display font-bold text-lg">Candidatures</span>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="font-display font-bold text-4xl leading-tight">
            Toutes tes candidatures,<br />un seul endroit.
          </h1>
          <ul className="space-y-3 text-white/80">
            <li className="flex items-center gap-3">
              <CheckCircle2 size={18} className="text-coral shrink-0" />
              Colle le lien d'une offre, c'est suivi.
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 size={18} className="text-coral shrink-0" />
              Statuts mis à jour automatiquement depuis tes emails.
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 size={18} className="text-coral shrink-0" />
              Trie par type de poste, statut, entreprise.
            </li>
          </ul>
        </div>

        <p className="relative z-10 text-sm text-white/50">Gratuit. Tes données restent à toi.</p>
      </div>

      {/* Formulaire */}
      <div className="flex-1 flex items-center justify-center p-6 bg-canvas">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-9 h-9 rounded-lg bg-coral flex items-center justify-center">
              <Briefcase size={18} className="text-white" />
            </div>
            <span className="font-display font-bold text-lg text-navy">Candidatures</span>
          </div>

          <div className="bg-white rounded-card shadow-card p-8">
            <h2 className="font-display font-bold text-2xl text-ink mb-1">
              {mode === "connexion" ? "Content de te revoir" : mode === "inscription" ? "Crée ton compte" : "Mot de passe oublié"}
            </h2>
            <p className="text-ink-muted text-sm mb-6">
              {mode === "connexion" ? "Connecte-toi pour suivre tes candidatures." : mode === "inscription" ? "Quelques secondes, c'est gratuit." : "On t'envoie un lien pour le réinitialiser."}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-ink mb-1.5 block">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="toi@exemple.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-coral focus:ring-1 focus:ring-coral outline-none transition"
                  />
                </div>
              </div>
              {mode !== "oubli" && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium text-ink">Mot de passe</label>
                    {mode === "connexion" && (
                      <button
                        type="button"
                        onClick={() => { setMode("oubli"); setError(null); setMessage(null); }}
                        className="text-xs text-coral hover:underline"
                      >
                        Oublié ?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-coral focus:ring-1 focus:ring-coral outline-none transition"
                    />
                  </div>
                </div>
              )}

              {error && <p className="text-sm text-status-refuse bg-status-refuse/5 border border-status-refuse/20 rounded-lg px-3 py-2">{error}</p>}
              {message && <p className="text-sm text-status-accepte bg-status-accepte/5 border border-status-accepte/20 rounded-lg px-3 py-2">{message}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-navy hover:bg-navy-light text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {loading ? "..." : mode === "connexion" ? "Se connecter" : mode === "inscription" ? "Créer mon compte" : "Envoyer le lien"}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>

            <p className="text-center text-sm text-ink-muted mt-6">
              {mode === "oubli" ? (
                <button
                  onClick={() => { setMode("connexion"); setError(null); setMessage(null); }}
                  className="text-coral font-medium hover:underline"
                >
                  Retour à la connexion
                </button>
              ) : (
                <>
                  {mode === "connexion" ? "Pas encore de compte ?" : "Déjà un compte ?"}{" "}
                  <button
                    onClick={() => {
                      setMode(mode === "connexion" ? "inscription" : "connexion");
                      setError(null);
                      setMessage(null);
                    }}
                    className="text-coral font-medium hover:underline"
                  >
                    {mode === "connexion" ? "Inscris-toi" : "Connecte-toi"}
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
