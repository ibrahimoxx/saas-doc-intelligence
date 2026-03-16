"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { tenantService } from "@/services/tenant.service";
import type { TenantMembership } from "@/types/tenant.types";
import {
  FileText,
  MessageSquare,
  Users,
  Database,
  ChevronDown,
  LogOut,
  Shield,
  Zap,
  ArrowRight,
} from "lucide-react";

const TILES = [
  {
    key: "documents",
    label: "Documents",
    icon: FileText,
    href: "/documents",
    iconColor: "text-violet-400",
    bgColor: "bg-violet-500/10",
    borderColor: "border-violet-500/20",
    shadowColor: "shadow-violet-500/10",
  },
  {
    key: "chat",
    label: "Conversations",
    icon: MessageSquare,
    href: "/chat",
    iconColor: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    shadowColor: "shadow-blue-500/10",
  },
  {
    key: "membres",
    label: "Membres",
    icon: Users,
    href: "/membres",
    iconColor: "text-pink-400",
    bgColor: "bg-pink-500/10",
    borderColor: "border-pink-500/20",
    shadowColor: "shadow-pink-500/10",
  },
  {
    key: "espaces",
    label: "Espaces",
    icon: Database,
    href: "/espaces",
    iconColor: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    shadowColor: "shadow-emerald-500/10",
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [tenants, setTenants] = useState<TenantMembership[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [loadingTenants, setLoadingTenants] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      tenantService.myTenants().then((res) => {
        if (res.data) {
          const data = res.data as unknown as TenantMembership[];
          setTenants(data);
          if (data.length > 0) setSelectedTenant(data[0].tenant.id);
        }
        setLoadingTenants(false);
      });
    }
  }, [isAuthenticated]);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (isLoading || (!isAuthenticated && !isLoading)) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-10 h-10 border-[3px] border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  const currentTenant = tenants.find((m) => m.tenant.id === selectedTenant);

  return (
    <div className="min-h-screen bg-[#0d111c] text-slate-200 antialiased">
      {/* ── Top Navigation ─────────────────────── */}
      <header className="nav-border py-4 px-8 flex justify-between items-center bg-[#131722]">
        {/* Left */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gradient font-heading">
              DocPilot AI
            </h1>
          </div>

          {tenants.length > 0 && (
            <div className="relative">
              <select
                value={selectedTenant || ""}
                onChange={(e) => setSelectedTenant(e.target.value)}
                className="appearance-none bg-[#1e2330] border border-white/10 text-slate-300 text-sm rounded-xl py-2 pl-3 pr-8 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors cursor-pointer"
              >
                {tenants.map((m) => (
                  <option key={m.tenant.id} value={m.tenant.id} className="bg-slate-900">
                    {m.tenant.name} · {m.role}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-sm text-slate-400">{user?.email}</span>
          {user?.is_superuser && (
            <button
              onClick={() => router.push("/admin/dashboard")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              Admin
            </button>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </header>

      {/* ── Main Content ───────────────────────── */}
      <main className="flex-grow p-8 max-w-5xl mx-auto w-full">
        {/* Welcome Banner */}
        <section
          className="rounded-2xl p-10 mb-8"
          style={{
            border: "1px solid rgba(255,255,255,0.2)",
            background: "linear-gradient(145deg, rgba(255,255,255,0.08), rgba(0,0,0,0.4))",
            boxShadow: "0 4px 30px rgba(0,0,0,0.4)",
          }}
        >
          <h2 className="text-3xl font-semibold mb-2 text-white font-heading">
            Bienvenue, {user?.full_name || user?.email} 👋
          </h2>
          <p className="text-slate-400 text-base">
            {currentTenant
              ? `Organisation : ${currentTenant.tenant.name} — Rôle : ${currentTenant.role}`
              : loadingTenants
              ? "Chargement de l'organisation…"
              : "Aucune organisation trouvée."}
          </p>
        </section>

        {/* Stat Cards Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TILES.map(({ key, label, icon: Icon, href, iconColor, bgColor, borderColor }) => (
            <div
              key={key}
              onClick={() => router.push(href)}
              className={`stat-card p-6 flex flex-col cursor-pointer group`}
            >
              <div className={`mb-4 w-12 h-12 rounded-xl ${bgColor} border ${borderColor} flex items-center justify-center transition-transform duration-200 group-hover:scale-110`}>
                <Icon className={`w-6 h-6 ${iconColor}`} />
              </div>
              <p className="text-slate-400 text-sm font-medium mb-1">{label}</p>
              <div className="flex items-center justify-between mt-auto pt-2">
                <p className="text-3xl font-bold text-white">—</p>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
