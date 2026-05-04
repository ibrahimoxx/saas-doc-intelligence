"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { ArrowRight, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { cn } from "@/lib/cn";

type InvitationData = { email: string; role: string; tenant_name: string; expires_at: string };
type FormState = { full_name: string; password: string; password_confirm: string };

const invitationErrors: Record<string, string> = {
  invalid_token: "Lien invalide ou inexistant.",
  already_consumed: "Cette invitation a déjà été utilisée. Connectez-vous.",
  expired: "Ce lien a expiré. Demandez une nouvelle invitation.",
  revoked: "Cette invitation a été révoquée.",
};

const errorTitles: Record<string, string> = {
  invalid_token: "Lien invalide",
  already_consumed: "Invitation utilisée",
  expired: "Lien expiré",
  revoked: "Invitation révoquée",
};

const roleLabels: Record<string, string> = {
  admin: "Administrateur",
  manager: "Manager",
  member: "Membre",
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

    if (form.password.length < 10) {
      setError("Le mot de passe doit contenir au moins 10 caractères.");
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
      password_confirm: form.password_confirm,
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

  /* ── Loading state ── */
  if (loadingInvitation) return <PageLoader />;

  /* ── Error state ── */
  const isError = !invitation || (
    errorCode === "invalid_token" ||
    errorCode === "already_consumed" ||
    errorCode === "expired" ||
    errorCode === "revoked"
  );

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-bg-base">
        <div className="w-full max-w-md text-center space-y-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-error/10 border border-error/20 flex items-center justify-center">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <div className="space-y-3">
            <h1 className="font-serif text-3xl text-fg-primary">
              {errorCode ? (errorTitles[errorCode] ?? "Invitation indisponible") : "Invitation indisponible"}
            </h1>
            <p className="text-sm text-fg-secondary">
              {error ?? "Lien invalide ou expiré."}
            </p>
          </div>
          <Button variant="ghost" asChild>
            <Link href="/login">
              Retour à la connexion <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  /* ── Success state ── */
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-bg-base">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-success/10 border border-success/20 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="font-serif text-3xl text-fg-primary">
            Bienvenue dans {invitation.tenant_name}
          </h1>
          <p className="text-sm text-fg-secondary">{success}</p>
        </div>
      </div>
    );
  }

  /* ── Form state ── */
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-bg-base">
      <div className="w-full max-w-md space-y-10">
        {/* Header */}
        <header className="space-y-4">
          <p className="text-xs font-mono tracking-widest text-brand-primary uppercase">
            Invitation d&apos;accès
          </p>
          <h1 className="font-serif text-4xl text-fg-primary leading-tight">
            Rejoindre {invitation.tenant_name}
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-fg-secondary">{invitation.email}</span>
            <span className="text-fg-muted">·</span>
            <Badge variant="indigo">
              {roleLabels[invitation.role] ?? invitation.role}
            </Badge>
          </div>
        </header>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            type="text"
            label="Nom complet"
            required
            value={form.full_name}
            onChange={(e) => handleChange("full_name", e.target.value)}
            placeholder="Votre nom complet"
            autoComplete="name"
          />
          <Input
            type="password"
            label="Mot de passe"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => handleChange("password", e.target.value)}
            autoComplete="new-password"
          />
          <Input
            type="password"
            label="Confirmer le mot de passe"
            required
            value={form.password_confirm}
            onChange={(e) => handleChange("password_confirm", e.target.value)}
            autoComplete="new-password"
          />

          {error && <ErrorBanner message={error} dismissible={false} />}

          {errorCode === "email_exists" && (
            <p className="text-sm text-center">
              <Link href="/login" className="text-brand-primary hover:text-brand-secondary transition-colors">
                Aller à la connexion →
              </Link>
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={submitting}
            className="w-full"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Créer mon compte
          </Button>
        </form>
      </div>
    </div>
  );
}
