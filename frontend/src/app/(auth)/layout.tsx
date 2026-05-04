import type { ReactNode } from "react";
import Image from "next/image";
import { CheckCircle2, FileSearch, LockKeyhole } from "lucide-react";

const authFeatures = [
  {
    icon: FileSearch,
    title: "Recherche contextuelle",
    description: "Retrouvez le bon document, la bonne clause et la bonne preuve sans friction.",
  },
  {
    icon: LockKeyhole,
    title: "Contrôle d'accès fin",
    description: "Partagez l'information au bon niveau avec des espaces et rôles maîtrisés.",
  },
  {
    icon: CheckCircle2,
    title: "Décisions plus rapides",
    description: "Accélérez les validations internes avec une base documentaire exploitable.",
  },
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-base lg:flex">
      <aside className="aurora-bg noise-overlay relative hidden overflow-hidden border-r border-border-subtle lg:flex lg:w-2/5 lg:flex-col">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(8,9,15,0.45),transparent_38%)]" />
        <div className="relative z-10 flex min-h-screen flex-1 flex-col justify-between px-10 py-12 xl:px-14 xl:py-14">
          <div className="space-y-12">
            <div className="inline-flex items-center gap-4 rounded-full border border-white/12 bg-white/8 px-5 py-3 backdrop-blur-md">
              <Image src="/brand/logo.svg" alt="DocPilot AI" width={36} height={36} priority />
              <div className="space-y-1">
                <p className="font-display text-sm font-semibold tracking-[0.24em] text-white/70 uppercase">
                  DocPilot AI
                </p>
                <p className="font-mono text-[11px] tracking-[0.2em] text-white/45 uppercase">
                  Workspace sécurisé
                </p>
              </div>
            </div>

            <div className="max-w-md space-y-6">
              <p className="font-serif text-5xl leading-none tracking-tight text-white xl:text-6xl">
                L&apos;intelligence documentaire pour les équipes ambitieuses
              </p>
              <p className="max-w-sm text-sm leading-7 text-white/70">
                Centralisez, sécurisez et activez votre connaissance métier dans un espace pensé pour les opérations exigeantes.
              </p>
            </div>

            <div className="space-y-4">
              {authFeatures.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/6 px-4 py-4 backdrop-blur-md"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/12 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-display text-sm font-semibold text-white">{title}</p>
                    <p className="text-sm leading-6 text-white/65">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mt-10 flex justify-end">
            <div className="auth-floating-doc relative w-full max-w-sm">
              <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-white/12 blur-3xl" />
              <svg
                viewBox="0 0 320 280"
                className="relative z-10 w-full drop-shadow-[0_24px_80px_rgba(8,9,15,0.35)]"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="auth-doc-surface" x1="0%" x2="100%" y1="0%" y2="100%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.94)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0.8)" />
                  </linearGradient>
                  <linearGradient id="auth-doc-accent" x1="0%" x2="100%" y1="0%" y2="0%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#14b8a6" />
                  </linearGradient>
                </defs>
                <g fill="none" fillRule="evenodd">
                  <path
                    d="M74 34h114l58 58v126c0 18.778-15.222 34-34 34H74c-18.778 0-34-15.222-34-34V68c0-18.778 15.222-34 34-34Z"
                    fill="url(#auth-doc-surface)"
                    opacity="0.94"
                  />
                  <path d="M188 34v44c0 11.046 8.954 20 20 20h38" fill="#E9ECFF" />
                  <rect x="72" y="102" width="126" height="14" rx="7" fill="url(#auth-doc-accent)" />
                  <rect x="72" y="132" width="166" height="11" rx="5.5" fill="#CBD3FF" />
                  <rect x="72" y="156" width="150" height="11" rx="5.5" fill="#D6DCF7" />
                  <rect x="72" y="180" width="132" height="11" rx="5.5" fill="#E3E7F8" />
                  <rect x="72" y="212" width="84" height="26" rx="13" fill="#0F172A" opacity="0.92" />
                  <rect x="168" y="212" width="60" height="26" rx="13" fill="#14B8A6" opacity="0.22" />
                  <circle cx="258" cy="70" r="28" fill="#08090F" opacity="0.14" />
                  <path
                    d="M255 57c12.15 0 22 9.85 22 22s-9.85 22-22 22-22-9.85-22-22 9.85-22 22-22Zm-3.25 10.5v10.75H241v6.5h10.75V95.5h6.5V84.75H269v-6.5h-10.75V67.5h-6.5Z"
                    fill="#14B8A6"
                    opacity="0.86"
                  />
                </g>
              </svg>
            </div>
          </div>
        </div>

        <style jsx>{`
          .auth-floating-doc {
            animation: auth-float 12s ease-in-out infinite;
          }

          @keyframes auth-float {
            0%,
            100% {
              transform: translate3d(0, 0, 0) rotate(-4deg);
            }
            50% {
              transform: translate3d(-10px, -16px, 0) rotate(2deg);
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .auth-floating-doc {
              animation: none;
            }
          }
        `}</style>
      </aside>

      <main className="flex min-h-screen w-full items-center justify-center bg-bg-base lg:w-3/5">
        <div className="w-full">{children}</div>
      </main>
    </div>
  );
}
