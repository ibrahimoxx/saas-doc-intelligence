"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import {
  LayoutDashboard,
  Users,
  Settings,
  Shield,
  LogOut,
  ChevronLeft,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();
  const [isSidebarOpen, setSidebarOpen] = useState(true);

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
    <div className="flex h-screen overflow-hidden bg-bg-base">
      {/* Sidebar */}
      <motion.aside
        animate={{ width: isSidebarOpen ? 256 : 80 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="relative flex shrink-0 flex-col border-r border-border-subtle bg-bg-elevated-1/60 backdrop-blur-sm overflow-hidden"
      >
        <div className="flex h-full flex-col gap-6 p-4">
          {/* Brand */}
          <div className="flex h-14 items-center gap-3 px-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl aurora-bg shadow-[0_4px_16px_-4px_rgba(99,102,241,0.5)]">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <AnimatePresence initial={false}>
              {isSidebarOpen && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
                  className="font-display text-sm font-bold text-fg-primary whitespace-nowrap"
                >
                  Admin Console
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              if (!item.available) {
                return (
                  <div
                    key={item.label}
                    className="flex h-10 items-center gap-3 rounded-xl px-3 text-fg-muted cursor-not-allowed"
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <AnimatePresence initial={false}>
                      {isSidebarOpen && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex flex-1 items-center justify-between text-xs font-semibold whitespace-nowrap"
                        >
                          {item.label}
                          <span className="rounded-md border border-border-subtle bg-bg-elevated-2 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-fg-muted">
                            Bientôt
                          </span>
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }
              return (
                <Link
                  key={item.href}
                  href={item.href!}
                  className={`relative flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors ${
                    active
                      ? "bg-brand-primary/10 text-fg-primary"
                      : "text-fg-tertiary hover:bg-bg-elevated-2 hover:text-fg-primary"
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="admin-nav-indicator"
                      className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full aurora-bg"
                      transition={{ duration: 0.25 }}
                    />
                  )}
                  <item.icon className="h-4 w-4 shrink-0" />
                  <AnimatePresence initial={false}>
                    {isSidebarOpen && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              );
            })}
          </nav>

          {/* Footer actions */}
          <div className="space-y-1">
            <Link
              href="/dashboard"
              className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-fg-tertiary transition-colors hover:bg-bg-elevated-2 hover:text-brand-primary"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              <AnimatePresence initial={false}>
                {isSidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-xs font-semibold whitespace-nowrap"
                  >
                    Tableau de bord
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>

            <button
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-fg-tertiary transition-colors hover:bg-bg-elevated-2 hover:text-fg-primary"
            >
              <ChevronLeft
                className={`h-4 w-4 shrink-0 transition-transform duration-300 ${isSidebarOpen ? "" : "rotate-180"}`}
              />
              <AnimatePresence initial={false}>
                {isSidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-xs font-semibold whitespace-nowrap"
                  >
                    Réduire
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            <button
              onClick={async () => { await logout(); router.push("/login"); }}
              className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-fg-tertiary transition-colors hover:bg-error/5 hover:text-error"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <AnimatePresence initial={false}>
                {isSidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-xs font-semibold whitespace-nowrap"
                  >
                    Quitter
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto scrollbar-hidden">
        <div className="mx-auto max-w-7xl px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
