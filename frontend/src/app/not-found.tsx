import Link from "next/link";
import { Home } from "lucide-react";

export const metadata = {
  title: "Page introuvable · DocPilot AI",
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-bg-base px-6 text-center">
      <div className="space-y-2">
        <p className="font-mono text-[80px] font-bold leading-none text-fg-muted">404</p>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-fg-tertiary">
          Page introuvable
        </p>
      </div>

      <div className="space-y-2">
        <h1 className="font-serif text-4xl tracking-tight text-fg-primary">
          Cette page n'existe pas
        </h1>
        <p className="text-sm text-fg-secondary max-w-sm">
          Le lien est peut-être expiré ou l'adresse incorrecte. Retournez à l'accueil.
        </p>
      </div>

      <Link
        href="/dashboard"
        className="flex items-center gap-2 rounded-2xl aurora-bg px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(99,102,241,0.5)] transition-opacity hover:opacity-90"
      >
        <Home className="h-4 w-4" />
        Retour à l'accueil
      </Link>
    </div>
  );
}
