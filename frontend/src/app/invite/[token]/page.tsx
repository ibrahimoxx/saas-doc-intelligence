"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Input } from "@/components/ui/Input";
import { LoadingSpinner, PageLoader } from "@/components/ui/LoadingSpinner";
import { authService } from "@/services/auth.service";
import { ArrowRight, CalendarClock, CheckCircle2, Mail, Shield, UserPlus, X } from "lucide-react";

type InvitationData = { email: string; role: string; tenant_name: string; expires_at: string };
type FormState = { full_name: string; password: string; password_confirm: string };

const invitationErrors: Record<string, string> = {
  invalid_token: "Lien invalide ou inexistant.",
  already_consumed: "Cette invitation a déjà été utilisée. Connectez-vous.",
  expired: "Ce lien a expiré. Demandez une nouvelle invitation.",
  revoked: "Cette invitation a été révoquée.",
};

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter();
  const { token } = use(params);
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

  const errorTitle =
    errorCode === "expired"
      ? "Lien expiré"
      : errorCode === "revoked"
        ? "Invitation révoquée"
        : errorCode === "already_consumed"
          ? "Invitation utilisée"
          : "Invitation invalide";

  const roleVariant =
    invitation?.role === "admin"
      ? "indigo"
      : invitation?.role === "manager"
        ? "blue"
        : invitation?.role === "viewer"
          ? "slate"
          : "purple";

  const formattedExpiry = invitation
    ? new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(invitation.expires_at))
    : null;

  if (loadingInvitation) {
    return <PageLoader />;
  }

  if (!invitation || errorCode === "invalid_token" || errorCode === "already_consumed" || errorCode === "expired" || errorCode === "revoked") {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-xl items-center justify-center px-8 py-16">
        <div className="surface-glass w-full rounded-[32px] border border-border-subtle px-8 py-10 text-center shadow-[0_40px_120px_-56px_rgba(0,0,0,0.95)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl aurora-bg shadow-[0_24px_64px_-32px_rgba(99,102,241,0.7)]">
            <X className="h-8 w-8 text-white" />
          </div>
          <div className="mt-6 space-y-3">
            <h1 className="font-serif text-4xl tracking-tight text-fg-primary">{errorTitle}</h1>
            <p className="text-sm leading-7 text-fg-secondary">{error ?? "Lien invalide ou expiré."}</p>
          </div>
          <div className="mt-8 flex justify-center">
            <Button
              type="button"
              variant="ghost"
              size="lg"
              rightIcon={<ArrowRight className="h-4 w-4" />}
              onClick={() => router.push("/login")}
            >
              Retour à la connexion
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-8 py-12">
      <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="surface-glass sticky top-12 overflow-hidden rounded-[32px] border border-border-subtle p-7">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-28 aurora-bg opacity-30 blur-3xl" />
            <div className="relative z-10 space-y-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-bg-elevated-2 text-brand-primary shadow-[0_24px_64px_-32px_rgba(99,102,241,0.7)]">
                <UserPlus className="h-6 w-6" />
              </div>
              <div className="space-y-3">
                <Badge variant="indigo" dot>
                  Invitation active
                </Badge>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-fg-tertiary">Invité par email</p>
                  <p className="flex items-center gap-2 text-sm text-fg-secondary">
                    <Mail className="h-4 w-4 text-brand-primary" />
                    {invitation.email}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-fg-tertiary">Espace</p>
                  <p className="mt-2 font-serif text-3xl tracking-tight text-fg-primary">{invitation.tenant_name}</p>
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border border-border-subtle bg-bg-elevated-2/70 p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-fg-secondary">Rôle attribué</span>
                  <Badge variant={roleVariant} dot>
                    {invitation.role}
                  </Badge>
                </div>
                <div className="flex items-start gap-3 text-sm text-fg-secondary">
                  <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-brand-accent" />
                  <div className="space-y-1">
                    <p className="text-fg-primary">Valable jusqu&apos;au {formattedExpiry}</p>
                    <p className="text-xs leading-6 text-fg-tertiary">
                      Finalisez la création de votre compte pour rejoindre immédiatement l&apos;espace partagé.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <section className="surface-glass rounded-[32px] border border-border-subtle p-6 shadow-[0_40px_120px_-56px_rgba(0,0,0,0.95)] sm:p-8 lg:p-10">
          <div className="space-y-8">
            <header className="space-y-5">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-border-strong bg-bg-elevated-2 text-brand-primary shadow-[0_24px_64px_-32px_rgba(99,102,241,0.65)]">
                <Shield className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-fg-tertiary">Invitation d&apos;accès</p>
                <h1 className="font-serif text-4xl tracking-tight text-fg-primary sm:text-5xl">
                  Rejoindre {invitation.tenant_name}
                </h1>
                <p className="text-sm leading-7 text-fg-secondary">
                  Créez votre compte pour accéder à l&apos;espace invité avec l&apos;adresse {invitation.email}.
                </p>
              </div>
            </header>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <Input
                  type="email"
                  label="Adresse email"
                  value={invitation.email}
                  readOnly
                  onChange={() => undefined}
                  className="bg-bg-elevated-2/30 cursor-not-allowed select-none opacity-70"
                />
                <Input
                  type="text"
                  required
                  label="Nom complet"
                  value={form.full_name}
                  onChange={(e) => handleChange("full_name", e.target.value)}
                  placeholder="Votre nom complet"
                  className="bg-bg-elevated-2/70"
                />
                <Input
                  type="password"
                  required
                  minLength={8}
                  label="Mot de passe"
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  className="bg-bg-elevated-2/70"
                />
                <Input
                  type="password"
                  required
                  label="Confirmer le mot de passe"
                  value={form.password_confirm}
                  onChange={(e) => handleChange("password_confirm", e.target.value)}
                  className="bg-bg-elevated-2/70"
                />
              </div>

              {error && (
                <div className="space-y-3">
                  <ErrorBanner message={error} dismissible={false} />
                  {errorCode === "email_exists" && (
                    <div className="flex justify-start">
                      <Button type="button" variant="ghost" onClick={() => router.push("/login")}>
                        Aller à la connexion
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {success && (
                <div className="flex items-center gap-3 rounded-2xl border border-success/20 bg-success/10 px-4 py-4 text-sm text-success">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <p className="font-medium">Compte créé. Redirection...</p>
                  <LoadingSpinner size="sm" className="ml-auto" />
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={submitting}
                disabled={submitting}
                rightIcon={<ArrowRight className="h-4 w-4" />}
                className="w-full"
              >
                Rejoindre {invitation.tenant_name}
              </Button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
