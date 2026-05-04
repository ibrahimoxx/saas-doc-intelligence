"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import type { Metadata } from "next";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.push("/dashboard");
  }, [isLoading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setErrorCode(null);
    const res = await login(form.email, form.password);
    if (!res.ok) {
      setError(res.error || "Identifiants invalides.");
      setErrorCode(res.errorCode || null);
    }
    setLoading(false);
  };

  if (isLoading || (isAuthenticated && !isLoading)) return null;

  return (
    <div className="w-full space-y-10">
      {/* Header */}
      <header className="space-y-2">
        <p className="text-xs font-mono tracking-widest text-brand-primary uppercase">
          Connexion
        </p>
        <h1 className="font-serif text-4xl text-fg-primary leading-tight">
          Bienvenue.
        </h1>
        <p className="text-sm text-fg-secondary">
          Connectez-vous à votre espace documentaire.
        </p>
      </header>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          type="email"
          label="Adresse email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="nom@entreprise.com"
          autoComplete="email"
        />

        <Input
          type="password"
          label="Mot de passe"
          required
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          autoComplete="current-password"
        />

        {/* Error states */}
        {error && errorCode === "account_disabled" && (
          <div className="p-4 bg-warning/10 border border-warning/20 rounded-xl space-y-1">
            <p className="text-sm font-semibold text-amber-400">
              Votre compte est désactivé.
            </p>
            <p className="text-xs text-amber-400/70">
              Contactez un administrateur pour réactiver votre accès.
            </p>
          </div>
        )}

        {error && errorCode !== "account_disabled" && (
          <ErrorBanner message={error} dismissible={false} />
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
          className="w-full"
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Accéder à l&apos;espace
        </Button>
      </form>

      {/* Footer */}
      <p className="text-center text-xs text-fg-muted">
        Propulsé par{" "}
        <span className="text-brand-primary font-mono">DocPilot AI</span>
      </p>
    </div>
  );
}
