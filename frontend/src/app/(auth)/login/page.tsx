// src/app/(auth)/login/page.tsx
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
    <div className="diagonal-split-bg min-h-screen flex items-center justify-center p-6 antialiased">
      {/* Background Atmosphere Blobs */}
      <div className="bg-blob bg-indigo-500/10 top-[20%] left-[15%]" />
      <div className="bg-blob bg-purple-500/10 bottom-[20%] right-[15%]" />

      <main className="w-full max-w-[480px] relative z-10 animate-fade-in-up">
        <div className="bg-[#131722]/80 backdrop-blur-2xl border border-white/5 rounded-[40px] p-12 shadow-2xl relative overflow-hidden">
          {/* Header */}
          <header className="flex flex-col items-center mb-12">
            <div className="mb-6 w-20 h-20 rounded-[28px] bg-gradient-brand flex items-center justify-center shadow-2xl shadow-indigo-500/20">
              <FileText className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tighter text-white mb-2 font-heading">
              DOCPILOT <span className="text-indigo-400">AI</span>
            </h1>
            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">
              Intelligence Documentaire SaaS
            </p>
          </header>

          {/* Error Message */}
          {error && (
            <div className="mb-8 flex items-center gap-4 p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 animate-shake">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm font-bold">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Adresse e-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nom@entreprise.com"
                required
                autoFocus
                className="block w-full px-6 py-5 bg-white/[0.03] border border-white/5 rounded-2xl text-white placeholder-slate-700 text-base font-bold transition-all focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.05]"
              />
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="block w-full px-6 py-5 bg-white/[0.03] border border-white/5 rounded-2xl text-white placeholder-slate-700 text-base font-bold transition-all focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.05]"
              />
            </div>
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-5 px-6 rounded-[24px] text-xs font-black uppercase tracking-[0.2em] text-white transition-all shadow-2xl hover:shadow-indigo-500/40 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-brand group"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                <span>{isLoading ? "AUTHENTIFICATION..." : "SE CONNECTER"}</span>
              </button>
            </div>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-12 pt-8 border-t border-white/5">
             <div className="flex flex-col items-center gap-4">
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Accès Démonstration</span>
                <div className="flex gap-4 font-mono text-[11px] text-indigo-400">
                   <div className="bg-indigo-500/5 px-3 py-1.5 rounded-lg border border-indigo-500/10">admin@docpilot.dev</div>
                   <div className="bg-indigo-500/5 px-3 py-1.5 rounded-lg border border-indigo-500/10 text-indigo-300">admin123456</div>
                </div>
             </div>
          </div>
        </div>
      </main>

      <style jsx global>{`
        @keyframes shake { 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); } 20%, 40%, 60%, 80% { transform: translateX(4px); } }
        .animate-shake { animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both; }
        .animate-fade-in-up { animation: fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
}
