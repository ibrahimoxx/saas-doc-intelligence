"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { FileText, AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);
    if (result.ok) {
      router.push("/dashboard");
    } else {
      setError(result.error || "Identifiants invalides.");
    }
  };

  return (
    <div className="diagonal-split-bg min-h-screen flex flex-col items-center justify-center p-4 antialiased">
      <main className="w-full max-w-md">
        {/* Card */}
        <div className="glowing-card bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          {/* Header */}
          <header className="flex flex-col items-center mb-8">
            <div className="mb-4 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
              <FileText className="w-10 h-10 text-cyan-400" style={{ filter: "drop-shadow(0 0 8px #22d3ee)" }} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2 font-heading">
              DocPilot AI
            </h1>
            <p className="text-sm text-slate-400 text-center">
              Votre plateforme d&apos;intelligence documentaire SaaS
            </p>
          </header>

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="mb-6 flex items-center gap-3 p-3 bg-red-900/30 border border-red-500/50 rounded-xl text-red-400"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                autoFocus
                autoComplete="email"
                className="block w-full px-4 py-3 bg-white/5 border border-indigo-500/40 rounded-xl text-white placeholder-slate-400 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
              />
            </div>
            <div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe"
                required
                autoComplete="current-password"
                className="block w-full px-4 py-3 bg-white/5 border border-indigo-500/40 rounded-xl text-white placeholder-slate-400 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
              />
            </div>
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                style={{ background: "linear-gradient(to right, #4A5DF1, #2B1676)" }}
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isLoading ? "Connexion…" : "Se connecter"}
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-xs text-slate-500 font-mono">
              Demo:{" "}
              <span className="text-indigo-400">admin@docpilot.dev</span>
              {" / "}
              <span className="text-indigo-400">admin123456</span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
