// src/app/(dashboard)/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { tenantService } from "@/services/tenant.service";
import type { TenantMembership } from "@/types/tenant.types";
import { TopBar } from "@/components/layout/TopBar";
import {
  FileText,
  MessageSquare,
  Users,
  Database,
  ArrowRight,
} from "lucide-react";

const TILES = [
  {
    key: "documents",
    label: "DOCUMENTS",
    icon: FileText,
    href: "/documents",
    iconColor: "text-violet-400",
    bgColor: "bg-violet-500/10",
    borderColor: "border-violet-500/20",
    glow: "rgba(139, 92, 246, 0.15)",
    count: "42",
  },
  {
    key: "chat",
    label: "CONVERSATIONS",
    icon: MessageSquare,
    href: "/chat",
    iconColor: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    glow: "rgba(59, 130, 246, 0.15)",
    count: "128",
  },
  {
    key: "membres",
    label: "MEMBRES",
    icon: Users,
    href: "/membres",
    iconColor: "text-pink-400",
    bgColor: "bg-pink-500/10",
    borderColor: "border-pink-500/20",
    glow: "rgba(236, 72, 153, 0.15)",
    count: "12",
  },
  {
    key: "espaces",
    label: "ESPACES",
    icon: Database,
    href: "/espaces",
    iconColor: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    glow: "rgba(16, 185, 129, 0.15)",
    count: "5",
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

  const handleTenantChange = (id: string) => {
    setSelectedTenant(id);
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
    <div className="min-h-screen text-slate-200 antialiased overflow-x-hidden">
      <TopBar
        userEmail={user?.email}
        isSuperuser={user?.is_superuser}
        tenants={tenants}
        selectedTenantId={selectedTenant}
        onTenantChange={handleTenantChange}
        onLogout={handleLogout}
        onAdminDashboard={() => router.push("/admin/dashboard")}
      />

      <main className="flex-grow p-8 md:p-12 max-w-7xl mx-auto w-full space-y-12">
        {/* Welcome Banner */}
        <section
          className="rounded-[24px] p-12 relative overflow-hidden group"
          style={{
            border: "1px solid rgba(255,255,255,0.1)",
            background: "linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0.5) 100%)",
            boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
          }}
        >
          {/* Subtle accent light */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/5 to-transparent pointer-events-none" />
          
          <div className="relative z-10">
            <h2 className="text-4xl font-bold mb-3 text-white font-heading tracking-tight">
              Bienvenue, {user?.full_name || user?.email} 👋
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
              {currentTenant
                ? `Vous travaillez actuellement dans l'organisation ` 
                : loadingTenants
                ? "Chargement de l'organisation…"
                : "Aucune organisation trouvée."}
              {currentTenant && (
                <span className="text-indigo-400 font-semibold">{currentTenant.tenant.name}</span>
              )}
              {currentTenant && ` avec le rôle de `}
              {currentTenant && (
                <span className="text-slate-200">{currentTenant.role}</span>
              )}
              . Prêt à extraire de la valeur de vos documents ?
            </p>
          </div>
        </section>

        {/* Stat Cards Grid — Stitch High Precision 1:1 */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {TILES.map(({ key, label, icon: Icon, href, iconColor, bgColor, borderColor, glow, count }) => (
            <div
              key={key}
              onClick={() => router.push(href)}
              className="group relative bg-[#131722] border border-white/5 rounded-[24px] p-10 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:border-white/10"
              style={{
                boxShadow: `0 15px 35px -5px rgba(0,0,0,0.5), 0 0 0 0 transparent`,
              }}
            >
              {/* Internal Glow Effect from bottom */}
              <div 
                className="absolute inset-0 rounded-[24px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: `radial-gradient(circle at bottom, ${glow} 0%, transparent 70%)`
                }}
              />

              <div className="relative z-10">
                <div className={`mb-8 w-14 h-14 rounded-[18px] ${bgColor} border ${borderColor} flex items-center justify-center transition-transform duration-300 group-hover:-translate-y-1`}>
                  <Icon className={`w-7 h-7 ${iconColor}`} />
                </div>
                
                <h3 className="text-slate-400 text-xs font-bold tracking-[0.2em] mb-2 uppercase">
                  {label}
                </h3>
                
                <div className="flex items-end justify-between">
                  <span className="text-6xl font-bold text-white tracking-tighter">
                    {count}
                  </span>
                  <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-slate-500 group-hover:text-white group-hover:border-white/30 group-hover:translate-x-1 transition-all">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
