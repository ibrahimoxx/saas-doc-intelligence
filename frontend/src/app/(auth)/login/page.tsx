// src/app/(auth)/login/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Shield, ArrowRight, Loader2, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();
  
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.push("/dashboard");
  }, [isLoading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await login(form.email, form.password);
    if (!res.success) setError(res.error || "Identifiants invalides.");
    setLoading(false);
  };

  if (isLoading || (isAuthenticated && !isLoading)) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-transparent">
      {/* Background Atmosphere already handled by layout mesh */}
      
      <div className="w-full max-w-xl animate-fluid-in">
        <div className="fluid-card space-y-12">
           <header className="text-center space-y-6">
              <div className="w-20 h-20 rounded-[32px] bg-gradient-brand flex items-center justify-center mx-auto shadow-2xl shadow-indigo-500/20 group hover:scale-110 transition-transform duration-700">
                 <Shield className="w-10 h-10 text-white" />
              </div>
              <div className="space-y-2">
                 <h1 className="text-5xl font-black tracking-tighter text-white">
                    DOCPILOT <span className="text-indigo-400">AI</span>
                 </h1>
                 <p className="text-slate-500 font-medium uppercase tracking-[0.4em] text-[10px]">
                    Intelligence Documentaire Secure
                 </p>
              </div>
           </header>

           <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] ml-4">
                       Adresse Email
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full bg-white/5 border border-white/5 rounded-[28px] px-8 py-5 text-white placeholder:text-slate-700 focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                      placeholder="nom@entreprise.com"
                    />
                 </div>

                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] ml-4">
                       Mot de Passe
                    </label>
                    <input
                      type="password"
                      required
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full bg-white/5 border border-white/5 rounded-[28px] px-8 py-5 text-white focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                    />
                 </div>
              </div>

              {error && (
                <div className="p-5 bg-red-500/5 border border-red-500/10 rounded-[28px] text-red-400 text-sm font-bold text-center animate-pulse">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-magnetic w-full py-6 flex items-center justify-center gap-4 group"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                  <>
                    <span>Accéder à l'Espace</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
           </form>

           <footer className="text-center">
              <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                 <Sparkles className="w-3 h-3 text-indigo-500" />
                 Propulsé par DocPilot AI Engine v2.0
              </p>
           </footer>
        </div>
      </div>
    </div>
  );
}
