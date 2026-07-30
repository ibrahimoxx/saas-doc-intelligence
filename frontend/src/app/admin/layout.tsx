"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/useAuth";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { Avatar } from "@/components/ui/Avatar";
import {
  LayoutDashboard,
  Users,
  Settings,
  Shield,
  LogOut,
  ArrowLeft,
  Moon,
  Sun,
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    if (!isLoading && (!user || !user.is_superuser)) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || !user.is_superuser) {
    return <PageLoader />;
  }

  const navItems = [
    { label: "Vue d'ensemble", href: "/admin/dashboard", icon: LayoutDashboard, available: true },
    { label: "Organisations", href: "/admin/tenants", icon: Shield, available: true },
    { label: "Utilisateurs", href: "/admin/users", icon: Users, available: true },
    { label: "Configuration", href: null, icon: Settings, available: false },
  ];

  return (
    <div className="min-h-screen bg-bg-base">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 z-40 flex w-[236px] flex-col border-r border-border-subtle bg-bg-sidebar">
        <div className="flex items-center gap-2.5 border-b border-border-subtle px-5 pb-[18px] pt-5">
          <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-md bg-fg-primary">
            <span className="h-2.5 w-2.5 bg-bg-base" />
          </div>
          <span className="text-[14.5px] font-bold tracking-[-0.01em] text-fg-primary">
            DocPilot <span className="text-brand-primary">AI</span>
          </span>
        </div>

        <div className="px-5 pb-1 pt-2.5 text-[10.5px] font-bold uppercase tracking-[0.06em] text-fg-tertiary">
          Console admin
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 pb-3.5 pt-2">
          {navItems.map((item) => {
            const active = pathname === item.href;

            if (!item.available) {
              return (
                <div
                  key={item.label}
                  className="flex cursor-not-allowed items-center gap-2.5 rounded-[7px] px-2.5 py-[9px] text-[13px] font-medium text-fg-muted"
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="flex flex-1 items-center justify-between">
                    {item.label}
                    <span className="rounded-[5px] border border-border-subtle bg-bg-elevated-1 px-1.5 py-px text-[9.5px] font-bold uppercase tracking-wider text-fg-tertiary">
                      Bientôt
                    </span>
                  </span>
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href!}
                className={`flex items-center gap-2.5 rounded-[7px] px-2.5 py-[9px] text-[13px] transition-colors ${
                  active
                    ? "bg-brand-soft font-semibold text-brand-primary"
                    : "font-medium text-fg-secondary hover:bg-bg-elevated-1 hover:text-fg-primary"
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}

          <div className="my-2.5 mx-0.5 h-px bg-border-subtle" />

          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 rounded-[7px] px-2.5 py-[9px] text-[13px] font-medium text-fg-secondary transition-colors hover:bg-bg-elevated-1 hover:text-fg-primary"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            Retour à l&apos;application
          </Link>
        </nav>

        <div className="flex flex-col gap-2.5 border-t border-border-subtle px-3 py-3.5">
          <div className="flex items-center gap-2.5">
            <Avatar name={user.full_name} email={user.email} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-semibold text-fg-primary">
                {user.full_name || user.email}
              </p>
              <p className="text-[11px] text-fg-tertiary">Superuser</p>
            </div>
          </div>
          <button
            onClick={async () => {
              await logout();
              router.push("/login");
            }}
            className="flex items-center gap-2 rounded-[7px] px-2.5 py-2 text-[12px] font-semibold text-fg-secondary transition-colors hover:bg-error-bg hover:text-error"
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" />
            Se déconnecter
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="ml-[236px] flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-border-subtle bg-bg-base px-6">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-error-border bg-error-bg px-2.5 py-1 text-[11px] font-bold tracking-[0.03em] text-error">
            MODE SUPERUSER — ACCÈS INTER-TENANTS
          </span>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              aria-label={isDark ? "Passer en thème clair" : "Passer en thème sombre"}
              className="flex h-8 w-8 items-center justify-center rounded-[7px] border border-border-subtle bg-bg-elevated-1 text-fg-secondary transition-colors hover:border-border-strong hover:text-fg-primary"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Avatar name={user.full_name} email={user.email} size="sm" />
          </div>
        </header>

        <main id="main" className="flex flex-1 flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}
