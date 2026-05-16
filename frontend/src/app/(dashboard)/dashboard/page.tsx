"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { tenantService } from "@/services/tenant.service";
import { useTenants } from "@/hooks/useTenants";
import { adminService } from "@/services/admin.service";
import type { TenantSummary, TenantPermissions } from "@/types/tenant.types";
import { TopBar } from "@/components/layout/TopBar";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { staggerContainer, fadeUp } from "@/lib/motion";
import {
  FileText,
  MessageSquare,
  Users,
  Database,
  ArrowUpRight,
} from "lucide-react";

const reducedFadeUp: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const reducedStagger: Variants = { hidden: {}, visible: {} };

const TILE_ICONS = {
  documents: FileText,
  chat: MessageSquare,
  membres: Users,
  espaces: Database,
};

const TILE_COLORS: Record<string, string> = {
  documents: "rgba(163,85,247,0.15)",
  chat: "rgba(59,130,246,0.15)",
  membres: "rgba(236,72,153,0.15)",
  espaces: "rgba(16,185,129,0.15)",
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const shouldReduceMotion = useReducedMotion();

  const { tenants, selectedTenantId: selectedTenant, setSelectedTenantId: setSelectedTenant, loading: loadingTenants } = useTenants();
  const [summary, setSummary] = useState<TenantSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [permissions, setPermissions] = useState<TenantPermissions | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!selectedTenant) return;
    setSummary(null);
    setPermissions(null);
    setLoadingSummary(true);

    if (user?.is_superuser) {
      Promise.all([
        adminService.getTenant(selectedTenant),
        tenantService.myPermissions(selectedTenant),
      ]).then(([tenantRes, permsRes]) => {
        if (tenantRes.data) {
          setSummary({
            documents: tenantRes.data.document_count,
            conversations: 0,
            members: tenantRes.data.member_count,
            spaces: tenantRes.data.space_count,
          });
        }
        if (permsRes.data) setPermissions(permsRes.data);
        else setPermissions({ role: "owner", can_upload: true, can_delete_documents: true, can_manage_members: true, can_view_admin: true, accessible_space_ids: [] });
        setLoadingSummary(false);
      });
    } else {
      Promise.all([
        tenantService.getTenantSummary(selectedTenant),
        tenantService.myPermissions(selectedTenant),
      ]).then(([summaryRes, permsRes]) => {
        if (summaryRes.data) setSummary(summaryRes.data);
        if (permsRes.data) setPermissions(permsRes.data);
        setLoadingSummary(false);
      });
    }
  }, [selectedTenant, user?.is_superuser]);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const handleTenantChange = (id: string) => {
    setSelectedTenant(id);
  };

  if (isLoading || (!isAuthenticated && !isLoading)) return <PageLoader />;

  const currentTenant = tenants.find((m) => m.tenant.id === selectedTenant);
  const isAdmin =
    permissions?.role === "admin" ||
    permissions?.role === "owner" ||
    permissions?.can_manage_members;

  const allTiles = [
    {
      key: "documents",
      label: "Documents",
      href: "/documents",
      count: summary?.documents ?? "—",
      restricted: false,
    },
    {
      key: "chat",
      label: "Conversations",
      href: "/chat",
      count: summary?.conversations ?? "—",
      restricted: false,
    },
    {
      key: "membres",
      label: "Membres",
      href: "/membres",
      count: summary?.members ?? "—",
      restricted: true,
    },
    {
      key: "espaces",
      label: "Espaces",
      href: "/espaces",
      count: summary?.spaces ?? "—",
      restricted: true,
    },
  ];

  const tiles = allTiles.filter((t) => !t.restricted || isAdmin);

  const firstName = user?.full_name?.split(" ")[0] || user?.email?.split("@")[0];

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  return (
    <div className="min-h-screen bg-bg-base">
      <TopBar
        userEmail={user?.email}
        isSuperuser={user?.is_superuser}
        tenants={tenants}
        selectedTenantId={selectedTenant}
        onTenantChange={handleTenantChange}
        onLogout={handleLogout}
        onAdminDashboard={() => router.push("/admin/dashboard")}
      />

      <main id="main" className="mx-auto max-w-6xl px-6 pt-28 pb-16">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={shouldReduceMotion ? reducedStagger : staggerContainer}
          className="space-y-12"
        >
          {/* Hero greeting */}
          <motion.section
            variants={shouldReduceMotion ? reducedFadeUp : fadeUp}
            className="space-y-4"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-fg-tertiary">
              Intelligence Documentaire
            </p>
            <h1 className="font-serif text-5xl tracking-tight text-fg-primary sm:text-6xl">
              {greeting},{" "}
              <span className="text-gradient">{firstName}</span>
            </h1>
            {currentTenant && (
              <p className="text-sm text-fg-secondary">
                Organisation active :{" "}
                <span className="font-semibold text-fg-primary">
                  {currentTenant.tenant.name}
                </span>
              </p>
            )}
          </motion.section>

          {/* Suspension banner */}
          {currentTenant?.tenant.status === "suspended" && (
            <motion.div
              variants={shouldReduceMotion ? reducedFadeUp : fadeUp}
              className="flex items-start gap-3 rounded-2xl border border-error/30 bg-error/10 px-5 py-4"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-error/20 text-[10px] font-bold text-error">!</span>
              <div>
                <p className="text-sm font-semibold text-error">Organisation suspendue</p>
                <p className="text-xs text-fg-secondary mt-0.5">
                  Cette organisation est suspendue. Les membres ne peuvent plus se connecter ni utiliser la plateforme. Réactivez-la depuis la console admin.
                </p>
              </div>
            </motion.div>
          )}

          {/* Metric tiles bento */}
          <motion.section
            variants={shouldReduceMotion ? reducedFadeUp : fadeUp}
            className={`grid gap-4 ${
              tiles.length === 4
                ? "grid-cols-2 lg:grid-cols-4"
                : tiles.length === 3
                ? "grid-cols-1 sm:grid-cols-3"
                : "grid-cols-1 sm:grid-cols-2 max-w-lg"
            }`}
          >
            {tiles.map((tile) => {
              const Icon = TILE_ICONS[tile.key as keyof typeof TILE_ICONS];
              const glow = TILE_COLORS[tile.key];
              return (
                <motion.button
                  key={tile.key}
                  onClick={() => router.push(tile.href)}
                  whileHover={shouldReduceMotion ? {} : { y: -4, scale: 1.02 }}
                  whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="group relative flex flex-col items-start gap-6 overflow-hidden rounded-[28px] border border-border-subtle bg-bg-elevated-1/80 p-6 text-left shadow-card backdrop-blur-sm transition-shadow hover:shadow-card-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base"
                  aria-label={`Accéder aux ${tile.label}`}
                >
                  <div
                    className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: `radial-gradient(circle at 30% 30%, ${glow}, transparent 70%)`,
                    }}
                  />
                  <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-border-strong bg-bg-elevated-2">
                    <Icon className="h-5 w-5 text-brand-primary" />
                  </div>
                  <div className="relative space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-widest text-fg-tertiary">
                      {tile.label}
                    </p>
                    <p
                      className={`font-display text-5xl font-bold tabular-nums text-fg-primary tracking-tight ${
                        loadingSummary ? "animate-pulse opacity-50" : ""
                      }`}
                    >
                      {tile.count}
                    </p>
                  </div>
                  <div className="relative mt-auto flex items-center gap-1 text-xs font-semibold text-fg-tertiary group-hover:text-brand-primary transition-colors">
                    <span>Voir</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </div>
                </motion.button>
              );
            })}
          </motion.section>

          {/* Quick info card */}
          {loadingTenants ? null : tenants.length === 0 ? (
            <motion.div
              variants={shouldReduceMotion ? reducedFadeUp : fadeUp}
              className="rounded-[28px] border border-border-subtle bg-bg-elevated-1/60 p-8 text-center"
            >
              <p className="text-sm text-fg-secondary">
                Aucune organisation disponible. Contactez un administrateur.
              </p>
            </motion.div>
          ) : null}
        </motion.div>
      </main>
    </div>
  );
}
