import Image from "next/image";
import { FileText, Shield, Zap } from "lucide-react";

const features = [
  { icon: Shield, text: "Accès sécurisé par rôle et espace" },
  { icon: FileText, text: "Réponses IA sourcées et traçables" },
  { icon: Zap, text: "Indexation instantanée de vos documents" },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — brand / marketing */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col justify-between p-12">
        {/* Aurora background */}
        <div className="absolute inset-0 aurora-bg noise-overlay" />
        {/* Darken overlay for readability */}
        <div className="absolute inset-0 bg-bg-base/60" />

        <div className="relative z-10 flex flex-col h-full">
          {/* Brand mark */}
          <div className="flex items-center gap-3">
            <Image
              src="/brand/logo.svg"
              alt="DocPilot AI"
              width={40}
              height={40}
              priority
            />
            <span className="font-display font-bold text-lg text-fg-primary tracking-tight">
              DocPilot <span className="text-brand-primary">AI</span>
            </span>
          </div>

          {/* Hero headline */}
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-xs font-mono tracking-widest text-brand-primary uppercase mb-6">
              Intelligence Documentaire
            </p>
            <h1 className="text-hero mb-8 leading-tight">
              L&apos;intelligence documentaire pour les équipes ambitieuses.
            </h1>
            <div className="space-y-4">
              {features.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-brand-primary" />
                  </div>
                  <p className="text-sm text-fg-secondary">{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-xs text-fg-muted">
            © 2026 DocPilot AI — Tous droits réservés
          </p>
        </div>
      </div>

      {/* Right panel — form content */}
      <div className="flex-1 flex items-center justify-center p-8 bg-bg-base">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
