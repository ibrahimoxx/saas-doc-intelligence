"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { Shield, ArrowRight } from "lucide-react";

const reducedFadeUp: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const reducedStagger: Variants = {
  hidden: {},
  visible: {},
};

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();
  const shouldReduceMotion = useReducedMotion();
  
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
    <motion.div
      className="mx-auto flex w-full max-w-sm flex-col justify-center px-8 py-16"
      initial="hidden"
      animate="visible"
      variants={shouldReduceMotion ? reducedStagger : staggerContainer}
    >
      <motion.div variants={shouldReduceMotion ? reducedFadeUp : fadeUp} className="space-y-6">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-border-strong bg-bg-elevated-2 text-brand-primary shadow-[0_24px_64px_-32px_rgba(99,102,241,0.65)]">
          <Shield className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h1 className="font-serif text-4xl tracking-tight text-fg-primary">Bienvenue</h1>
          <p className="text-sm text-fg-secondary">Connectez-vous à votre espace</p>
        </div>
      </motion.div>

      <motion.form
        onSubmit={handleSubmit}
        className="mt-10 space-y-6 rounded-[28px] border border-border-subtle bg-bg-elevated-1/80 p-6 shadow-[0_32px_80px_-40px_rgba(0,0,0,0.85)] backdrop-blur-sm"
        variants={shouldReduceMotion ? reducedFadeUp : fadeUp}
      >
        <div className="space-y-4">
          <Input
            type="email"
            required
            label="Adresse email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="nom@entreprise.com"
            className="bg-bg-elevated-2/70"
          />

          <Input
            type="password"
            required
            label="Mot de passe"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="bg-bg-elevated-2/70"
          />
        </div>

        {error &&
          (errorCode === "account_disabled" ? (
            <div className="rounded-2xl border border-warning/25 bg-warning/10 px-4 py-4 text-sm text-warning">
              <p className="font-semibold text-warning">Votre compte est désactivé.</p>
              <p className="mt-1 text-xs text-warning/80">
                Contactez un administrateur pour réactiver votre accès.
              </p>
            </div>
          ) : (
            <ErrorBanner message={error} dismissible={false} />
          ))}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
          disabled={loading}
          rightIcon={<ArrowRight className="h-4 w-4" />}
          className="w-full"
        >
          Accéder à l&apos;espace
        </Button>
      </motion.form>

      <motion.div
        variants={shouldReduceMotion ? reducedFadeUp : fadeUp}
        className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-fg-tertiary"
      >
        <Shield className="h-3.5 w-3.5 text-brand-primary" />
        <p>Sécurisé par DocPilot AI</p>
      </motion.div>
    </motion.div>
  );
}
