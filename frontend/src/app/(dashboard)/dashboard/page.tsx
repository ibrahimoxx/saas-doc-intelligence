"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { tenantService } from "@/services/tenant.service";
import { useTenants } from "@/hooks/useTenants";
import { adminService } from "@/services/admin.service";
import type { TenantSummary, TenantPermissions } from "@/types/tenant.types";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import {
  FileText,
  MessageSquare,
  Users,
  Database,
  History,
  ArrowUpRight,
} from "lucide-react";

const TILE_ICONS = {
  documents: FileText,
  chat: MessageSquare,
  membres: Users,
  espaces: Database,
  historique: History,
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  const {
    tenants,
    selectedTenantId: selectedTenant,
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

  return (
    <div className="px-8 pb-12 pt-7">
      {/* Header */}
      <div className="mb-[22px] flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="text-[22px] font-bold text-fg-primary">Tableau de bord</h1>
          <p className="mt-1 text-[13px] text-fg-secondary">
            {greeting} {firstName}
            {currentTenant && (
              <>
                {" — vue d'ensemble du tenant "}
                <strong className="font-semibold text-fg-primary">
                  {currentTenant.tenant.name}
                </strong>
              </>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => router.push("/documents")} className="dc-btn">
            Importer des documents
          </button>
          <button type="button" onClick={() => router.push("/chat")} className="dc-btn-primary">
            Nouvelle requête IA
          </button>
        </div>
      </div>

      {/* Suspension banner */}
      {currentTenant?.tenant.status === "suspended" && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-error-border bg-error-bg px-4 py-3">
          <span className="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-error/20 text-[10px] font-bold text-error">
            !
          </span>
          <div>
            <p className="text-[12.5px] font-semibold text-error">Organisation suspendue</p>
            <p className="mt-0.5 text-[12px] text-fg-secondary">
              Cette organisation est suspendue. Réactivez-la depuis la console admin.
            </p>
          </div>
        </div>
      )}

      {/* KPI tiles */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {tiles.map((tile) => {
          const Icon = TILE_ICONS[tile.key as keyof typeof TILE_ICONS];
          return (
            <button
              key={tile.key}
              type="button"
              onClick={() => router.push(tile.href)}
              className="dc-card group p-4 text-left transition-colors hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              aria-label={`Accéder ${tile.label}`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="dc-label">{tile.label}</span>
                <Icon className="h-4 w-4 shrink-0 text-fg-tertiary" />
              </div>
              <div
                className={`mt-2.5 text-2xl font-bold tabular-nums tracking-[-0.01em] text-fg-primary ${
                  loadingSummary ? "animate-pulse opacity-50" : ""
                }`}
              >
                {tile.count}
              </div>
              <div className="mt-1.5 flex items-center gap-1 text-[12px] font-semibold text-fg-tertiary transition-colors group-hover:text-brand-primary">
                Voir
                <ArrowUpRight className="h-3 w-3" />
              </div>
            </button>
          );
        })}
      </div>

      {!loadingTenants && tenants.length === 0 && (
        <div className="dc-card mt-5 p-8 text-center">
          <p className="text-[13px] text-fg-secondary">
            Aucune organisation disponible. Contactez un administrateur.
          </p>
        </div>
      )}
    </div>
  );
}
