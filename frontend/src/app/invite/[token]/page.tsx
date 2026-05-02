"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { Shield, Loader2, X, ArrowRight } from "lucide-react";

type InvitationData = { email: string; role: string; tenant_name: string; expires_at: string };
type FormState = { full_name: string; password: string; password_confirm: string };

const invitationErrors: Record<string, string> = {
  invalid_token: "Lien invalide ou inexistant.",
  already_consumed: "Cette invitation a déjà été utilisée. Connectez-vous.",
  expired: "Ce lien a expiré. Demandez une nouvelle invitation.",
  revoked: "Cette invitation a été révoquée.",
};

export default function InvitePage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const { token } = params;
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [form, setForm] = useState<FormState>({ full_name: "", password: "", password_confirm: "" });
  const [loadingInvitation, setLoadingInvitation] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const validateInvitation = async () => {
      setLoadingInvitation(true);
      setError(null);
      setErrorCode(null);

      const res = await authService.validateInvitation(token);
      if (!active) return;

      if (res.data) {
        setInvitation(res.data);
      } else {
        const code = res.error?.code ?? "invalid_token";
        setInvitation(null);
        setErrorCode(code);
        setError(invitationErrors[code] ?? res.error?.message ?? "Invitation invalide.");
      }
      setLoadingInvitation(false);
    };

    void validateInvitation();
    return () => {
      active = false;
    };
  }, [token]);

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setErrorCode(null);
    setSuccess(null);

    if (form.password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (form.password !== form.password_confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setSubmitting(true);
    const res = await authService.acceptInvitation(token, {
      full_name: form.full_name,
      password: form.password,
    });

    if (res.data) {
      localStorage.setItem("access_token", res.data.access);
      localStorage.setItem("refresh_token", res.data.refresh);
      setSuccess("Compte créé. Redirection en cours...");
      router.push("/dashboard");
      return;
    }

    const code = res.error?.code ?? null;
    setErrorCode(code);
    setError(code === "email_exists" ? "Un compte existe déjà. Connectez-vous." : res.error?.message ?? "Une erreur est survenue.");
    setSubmitting(false);
  };

  if (loadingInvitation) {
    return (
      <div className="min-h-screen flex items-center justify-center px-8 bg-transparent">
        <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (!invitation || errorCode === "invalid_token" || errorCode === "already_consumed" || errorCode === "expired" || errorCode === "revoked") {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-transparent">
        <div className="w-full max-w-xl animate-fluid-in">
          <div className="bg-white/[0.02] border border-white/10 rounded-[64px] p-16 text-center space-y-8">
            <div className="w-20 h-20 mx-auto rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <X className="w-10 h-10 text-red-400" />
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-black tracking-tighter text-white">Invitation indisponible</h1>
              <div className="p-5 bg-red-500/5 border border-red-500/10 rounded-[28px] text-red-400 text-sm font-bold text-center">
                {error ?? "Lien invalide ou expiré."}
              </div>
            </div>
            <Link href="/login" className="inline-flex items-center justify-center gap-3 text-sm font-black uppercase tracking-[0.25em] text-slate-300 hover:text-white transition-colors">Retour à la connexion <ArrowRight className="w-4 h-4" /></Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-transparent">
      <div className="w-full max-w-2xl animate-fluid-in">
        <div className="fluid-card space-y-10">
          <header className="text-center space-y-5">
            <div className="w-20 h-20 rounded-[32px] bg-gradient-brand flex items-center justify-center mx-auto shadow-2xl shadow-indigo-500/20">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Invitation d&apos;accès</p>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white">Rejoindre {invitation.tenant_name}</h1>
              <p className="text-slate-400 font-medium">{invitation.email} · {invitation.role}</p>
            </div>
          </header>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-5">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-4">Nom complet</label>
                <input type="text" required value={form.full_name} onChange={(e) => handleChange("full_name", e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-[28px] px-8 py-5 text-white focus:outline-none focus:border-indigo-500/50 transition-all font-medium" placeholder="Votre nom complet" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-4">Mot de passe</label>
                <input type="password" required minLength={8} value={form.password} onChange={(e) => handleChange("password", e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-[28px] px-8 py-5 text-white focus:outline-none focus:border-indigo-500/50 transition-all font-medium" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-4">Confirmer le mot de passe</label>
                <input type="password" required value={form.password_confirm} onChange={(e) => handleChange("password_confirm", e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-[28px] px-8 py-5 text-white focus:outline-none focus:border-indigo-500/50 transition-all font-medium" />
              </div>
            </div>

            {error && (
              <div className="space-y-3">
                <div className="p-5 bg-red-500/5 border border-red-500/10 rounded-[28px] text-red-400 text-sm font-bold text-center">{error}</div>
                {errorCode === "email_exists" && (
                  <div className="text-center">
                    <Link href="/login" className="text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors">Aller à la connexion</Link>
                  </div>
                )}
              </div>
            )}

            {success && (
              <div className="p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-[28px] text-emerald-400 text-sm font-bold text-center">
                {success}
              </div>
            )}

            <button type="submit" disabled={submitting} className="btn-magnetic w-full py-6 flex items-center justify-center gap-4 group disabled:opacity-70">{submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <><span>Créer mon compte</span><ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
