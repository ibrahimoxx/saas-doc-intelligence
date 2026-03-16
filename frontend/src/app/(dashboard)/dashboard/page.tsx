// src/app/(dashboard)/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { tenantService } from "@/services/tenant.service";
import type { TenantMembership, TenantSummary } from "@/types/tenant.types";
import { TopBar } from "@/components/layout/TopBar";
import {
  FileText,
  MessageSquare,
  Users,
  Database,
  ArrowUpRight,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [tenants, setTenants] = useState<TenantMembership[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [summary, setSummary] = useState<TenantSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

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

  useEffect(() => {
    if (selectedTenant) {
      setLoadingSummary(true);
      tenantService.getTenantSummary(selectedTenant).then((res) => {
        if (res.data) {
          setSummary(res.data);
        }
        setLoadingSummary(false);
      });
    }
  }, [selectedTenant]);

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

  const tiles = [
    {
      key: "documents",
      label: "Documents",
      icon: FileText,
      href: "/documents",
      color: "#8b5cf6",
      count: summary?.documents ?? "...",
    },
    {
      key: "chat",
      label: "Conversations",
      icon: MessageSquare,
      href: "/chat",
      color: "#3b82f6",
      count: summary?.conversations ?? "...",
    },
    {
      key: "membres",
      label: "Membres",
      icon: Users,
      href: "/membres",
      color: "#ec4899",
      count: summary?.members ?? "...",
    },
    {
      key: "espaces",
      label: "Espaces",
      icon: Database,
      href: "/espaces",
      color: "#10b981",
      count: summary?.spaces ?? "...",
    },
  ];

  return (
    <div className="min-h-screen">
      <TopBar
        userEmail={user?.email}
        isSuperuser={user?.is_superuser}
        tenants={tenants}
        selectedTenantId={selectedTenant}
        onTenantChange={handleTenantChange}
        onLogout={handleLogout}
        onAdminDashboard={() => router.push("/admin/dashboard")}
      />

      <main className="max-w-[1400px] mx-auto px-8 py-32 md:py-48 lg:py-56 space-y-24">
        {/* Subtle Hero Header */}
        <section className="text-center space-y-6 animate-fluid-in">
           <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/5 text-[10px] uppercase font-black tracking-[0.3em] text-indigo-400">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              Intelligence Documentaire
           </div>
           <h2 className="text-hero">
              Bienvenue, <br />
              <span className="text-gradient">{user?.full_name?.split(' ')[0] || user?.email?.split('@')[0]}</span>
           </h2>
           <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-medium">
              Explorez vos documents avec la précision de l'intelligence artificielle générative. 
              {currentTenant && (
                <> Organisation active : <span className="text-white font-bold">{currentTenant.tenant.name}</span></>
              )}
           </p>
        </section>

        {/* Fluid Metrics Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 animate-fluid-in" style={{ animationDelay: '200ms' }}>
          {tiles.map((tile, i) => (
            <div
              key={tile.key}
              onClick={() => router.push(tile.href)}
              className="fluid-card group cursor-pointer"
              style={{ animationDelay: `${(i+2)*100}ms` }}
            >
              <div 
                className="absolute inset-0 rounded-[48px] opacity-0 group-hover:opacity-10 transition-opacity duration-700 pointer-events-none"
                style={{ background: `radial-gradient(circle at center, ${tile.color}, transparent 70%)` }}
              />

              <div className="relative z-10 flex flex-col items-center text-center gap-8">
                <div className="w-16 h-16 rounded-[24px] bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                  <tile.icon className="w-8 h-8" style={{ color: tile.color }} />
                </div>
                
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 group-hover:text-white transition-colors">
                    {tile.label}
                  </p>
                  <div className={`text-6xl font-black text-white tracking-tighter tabular-nums leading-none ${loadingSummary ? 'animate-pulse opacity-50' : ''}`}>
                    {tile.count}
                  </div>
                </div>

                <div className="w-12 h-12 rounded-full border border-white/5 flex items-center justify-center text-slate-600 group-hover:text-white group-hover:border-white/20 group-hover:bg-white/5 transition-all">
                   <ArrowUpRight className="w-5 h-5" />
                </div>
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
