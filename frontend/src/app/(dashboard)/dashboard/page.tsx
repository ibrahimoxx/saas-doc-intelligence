"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  motion,
  useMotionValue,
  useMotionTemplate,
  useTransform,
  useSpring,
  useReducedMotion,
  type Variants,
} from "framer-motion";
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
  History,
  ArrowUpRight,
} from "lucide-react";

const reducedFadeUp: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const reducedStagger: Variants = { hidden: {}, visible: {} };

const TILE_ICONS = {
  documents: FileText,
  chat: MessageSquare,
  membres: Users,
  espaces: Database,
  historique: History,
};

const TILE_COLORS: Record<string, string> = {
  documents: "rgba(163,85,247,",
  chat: "rgba(59,130,246,",
  membres: "rgba(236,72,153,",
  espaces: "rgba(16,185,129,",
  historique: "rgba(168,85,247,",
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const shouldReduceMotion = useReducedMotion();

  const {
    tenants,
    selectedTenantId: selectedTenant,
    setSelectedTenantId: setSelectedTenant,
    loading: loadingTenants,
  } = useTenants();

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
        else
          setPermissions({
            role: "owner",
            can_upload: true,
            can_delete_documents: true,
            can_manage_members: true,
            can_view_admin: true,
            accessible_space_ids: [],
          });
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

  if (isLoading || (!isAuthenticated && !isLoading)) return <PageLoader />;

  const currentTenant = tenants.find((m) => m.tenant.id === selectedTenant);
  const isAdmin =
    permissions?.role === "admin" ||
    permissions?.role === "owner" ||
    permissions?.can_manage_members;

  const allTiles = [
    { key: "documents", label: "Documents", href: "/documents", count: summary?.documents ?? "—", restricted: false },
    { key: "chat", label: "Conversations", href: "/chat", count: summary?.conversations ?? "—", restricted: false },
    { key: "membres", label: "Membres", href: "/membres", count: summary?.members ?? "—", restricted: true },
    { key: "espaces", label: "Espaces", href: "/espaces", count: summary?.spaces ?? "—", restricted: true },
    { key: "historique", label: "Historique", href: "/historique", count: summary?.conversations ?? "—", restricted: true },
  ];

  const tiles = allTiles.filter((t) => !t.restricted || isAdmin);
  const firstName = user?.full_name?.split(" ")[0] || user?.email?.split("@")[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  const gridClass =
    tiles.length >= 5
      ? "grid-cols-2 lg:grid-cols-3"
      : tiles.length === 4
      ? "grid-cols-2 lg:grid-cols-4"
      : tiles.length === 3
      ? "grid-cols-1 sm:grid-cols-3"
      : "grid-cols-1 sm:grid-cols-2 max-w-lg";

  return (
    <div className="min-h-screen bg-bg-base">
      <TopBar
        userEmail={user?.email}
        isSuperuser={user?.is_superuser}
        tenants={tenants}
        selectedTenantId={selectedTenant}
        onTenantChange={setSelectedTenant}
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
          {/* Greeting */}
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
                  Cette organisation est suspendue. Réactivez-la depuis la console admin.
                </p>
              </div>
            </motion.div>
          )}

          {/* Tiles */}
          <motion.section
            variants={shouldReduceMotion ? reducedFadeUp : fadeUp}
            className={`grid gap-5 ${gridClass}`}
          >
            {tiles.map((tile, i) => {
              const Icon = TILE_ICONS[tile.key as keyof typeof TILE_ICONS];
              const baseColor = TILE_COLORS[tile.key];
              return (
                <motion.div
                  key={tile.key}
                  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <TiltCard
                    label={tile.label}
                    count={tile.count}
                    Icon={Icon}
                    baseColor={baseColor}
                    onClick={() => router.push(tile.href)}
                    loading={loadingSummary}
                    disableMotion={!!shouldReduceMotion}
                  />
                </motion.div>
              );
            })}
          </motion.section>

          {!loadingTenants && tenants.length === 0 && (
            <motion.div
              variants={shouldReduceMotion ? reducedFadeUp : fadeUp}
              className="rounded-[28px] border border-border-subtle bg-bg-elevated-1/60 p-8 text-center"
            >
              <p className="text-sm text-fg-secondary">
                Aucune organisation disponible. Contactez un administrateur.
              </p>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
}

function TiltCard({
  label,
  count,
  Icon,
  baseColor,
  onClick,
  loading,
  disableMotion,
}: {
  label: string;
  count: string | number;
  Icon: React.ElementType;
  baseColor: string;
  onClick: () => void;
  loading: boolean;
  disableMotion: boolean;
}) {
  const cardRef = useRef<HTMLButtonElement>(null);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const springX = useSpring(rawX, { stiffness: 180, damping: 22 });
  const springY = useSpring(rawY, { stiffness: 180, damping: 22 });

  const rotateX = useTransform(springY, [-0.5, 0.5], [12, -12]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-12, 12]);
  const spotX = useTransform(springX, [-0.5, 0.5], [10, 90]);
  const spotY = useTransform(springY, [-0.5, 0.5], [10, 90]);
  const spotlight = useMotionTemplate`radial-gradient(circle at ${spotX}% ${spotY}%, ${baseColor}0.55), transparent 62%)`;

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disableMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    rawX.set((e.clientX - rect.left) / rect.width - 0.5);
    rawY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    rawX.set(0);
    rawY.set(0);
  };

  const ring1 = `${baseColor}0.35)`;
  const ring2 = `${baseColor}0.15)`;
  const glowAmbient = `${baseColor}0.9)`;

  return (
    <div style={{ perspective: "1000px" }}>
      <motion.button
        ref={cardRef}
        onClick={onClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={disableMotion ? {} : { rotateX, rotateY }}
        whileTap={{ scale: 0.95 }}
        className="group relative w-full flex flex-col items-center gap-6 overflow-hidden rounded-[36px] border border-border-subtle bg-bg-elevated-1/80 px-6 pt-10 pb-8 shadow-card hover:shadow-card-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
        aria-label={`Accéder ${label}`}
      >
        {/* Cursor spotlight */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-[36px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: spotlight }}
        />

        {/* Ambient bottom glow */}
        <div
          className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 h-28 w-28 rounded-full blur-3xl opacity-0 group-hover:opacity-70 transition-opacity duration-700"
          style={{ background: glowAmbient }}
        />

        {/* Orbital rings + icon circle */}
        <div className="relative flex items-center justify-center h-36 w-36">
          {/* Outer slow rotate */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full"
            style={{ border: `1px dashed ${ring1}` }}
          />
          {/* Inner counter-rotate */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 36, repeat: Infinity, ease: "linear" }}
            className="absolute rounded-full"
            style={{
              inset: "10px",
              border: `1px solid ${ring2}`,
            }}
          />
          {/* Glow ring on hover */}
          <div
            className="absolute inset-4 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ boxShadow: `0 0 44px -6px ${glowAmbient}` }}
          />
          {/* Icon circle */}
          <div
            className="relative z-10 flex h-[88px] w-[88px] items-center justify-center rounded-full border border-border-strong bg-bg-elevated-2 group-hover:border-brand-primary/20 transition-colors duration-300"
            style={{ boxShadow: `inset 0 0 32px -12px ${ring1}` }}
          >
            <Icon className="h-8 w-8 text-brand-primary" />
          </div>
        </div>

        {/* Number */}
        <p
          className={`relative font-display text-6xl font-bold tabular-nums tracking-tight text-fg-primary ${
            loading ? "animate-pulse opacity-50" : ""
          }`}
        >
          {count}
        </p>

        {/* Label + Voir */}
        <div className="relative flex flex-col items-center gap-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-fg-tertiary">
            {label}
          </p>
          <div className="flex items-center gap-1 text-xs font-semibold text-fg-muted group-hover:text-brand-primary transition-colors duration-200">
            Voir
            <ArrowUpRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </motion.button>
    </div>
  );
}
