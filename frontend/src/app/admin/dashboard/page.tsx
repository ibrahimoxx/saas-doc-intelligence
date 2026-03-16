// src/app/admin/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { adminService, AdminStatsResponse, AdminRecentQuery } from "@/services/admin.service";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Users,
  FolderOpen,
  MessageSquare,
  Building2,
  TrendingUp,
  Clock,
  ChevronRight,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [recentQueries, setRecentQueries] = useState<AdminRecentQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAdminData() {
      try {
        setLoading(true);
        const [statsRes, queriesRes] = await Promise.all([
          adminService.getAdminStats(),
          adminService.getRecentQueries(),
        ]);

        if (statsRes.error) throw new Error(statsRes.error.message || "Failed to load stats");
        if (queriesRes.error) throw new Error(queriesRes.error.message || "Failed to load queries");

        setStats(statsRes.data!);
        setRecentQueries(queriesRes.data!);
      } catch (err: any) {
        setError(err.message || "Erreur de chargement.");
      } finally {
        setLoading(false);
      }
    }
    loadAdminData();
  }, []);

  if (loading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-slate-500 font-black uppercase tracking-widest text-[10px] animate-pulse">Indexation des métriques...</p>
      </div>
    );
  }

  if (error) {
    return (
       <div className="p-8 bg-red-500/10 border border-red-500/20 rounded-[32px] text-red-400 font-bold flex items-center gap-4">
         <span className="text-2xl">⚠️</span>
         <p>{error}</p>
       </div>
    );
  }

  return (
    <div className="space-y-16 animate-fade-in-up">
      {/* Page Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-indigo-400 font-bold tracking-widest text-[10px] uppercase">
             <TrendingUp className="w-4 h-4" />
             <span>Statistiques Globales</span>
          </div>
          <h1 className="text-5xl font-extrabold font-heading text-white leading-tight">
             Surveillance de la <br />
             <span className="text-gradient">plateforme IA</span>
          </h1>
        </div>
        
        <div className="flex items-center bg-[#131722] border border-white/5 rounded-[20px] p-2 gap-2 backdrop-blur-xl">
           <button className="px-6 py-2.5 rounded-2xl bg-gradient-brand text-white text-[10px] font-black uppercase tracking-widest shadow-xl">7 Jours</button>
           <button className="px-6 py-2.5 rounded-2xl text-slate-500 hover:text-slate-300 text-[10px] font-black uppercase tracking-widest transition-colors">30 Jours</button>
        </div>
      </section>

      {/* Metrics Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <AdminStatCard
            title="Organisations"
            value={stats.totals.tenants}
            trend={stats.recent_activity.new_tenants_7d}
            icon={Building2}
            glow="rgba(99,102,241,0.15)"
          />
          <AdminStatCard
            title="Utilisateurs"
            value={stats.totals.users}
            trend={stats.recent_activity.new_users_7d}
            icon={Users}
            glow="rgba(236,72,153,0.15)"
          />
          <AdminStatCard
            title="Documents"
            value={stats.totals.documents}
            trend={stats.recent_activity.new_documents_7d}
            icon={FolderOpen}
            glow="rgba(245,158,11,0.15)"
          />
          <AdminStatCard
            title="RAG Queries"
            value={stats.totals.queries}
            trend={stats.recent_activity.queries_7d}
            icon={MessageSquare}
            glow="rgba(16,185,129,0.15)"
          />
        </div>
      )}

      {/* Recent Activity Table */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
           <div className="space-y-1">
              <h3 className="text-2xl font-bold font-heading text-white">Interactions en temps réel</h3>
              <p className="text-slate-500 text-sm font-medium">Historique des dernières requêtes passées au moteur RAG.</p>
           </div>
           <button className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors">
              <span>Voir tout l'historique</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
           </button>
        </div>

        <div className="bg-[#131722] border border-white/5 rounded-[40px] overflow-hidden shadow-2xl backdrop-blur-3xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.03] border-b border-white/5">
                  <th className="py-7 px-10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Heure</th>
                  <th className="py-7 px-10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Utilisateur</th>
                  <th className="py-7 px-10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Organisation</th>
                  <th className="py-7 px-10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Requête</th>
                  <th className="py-7 px-10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-right">Moteur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentQueries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-24 text-center">
                       <p className="text-slate-600 font-black uppercase tracking-widest text-[10px]">Aucune donnée disponible</p>
                    </td>
                  </tr>
                ) : (
                  recentQueries.map((query) => (
                    <tr key={query.id} className="group hover:bg-white/[0.01] transition-all duration-300">
                      <td className="py-7 px-10 whitespace-nowrap">
                         <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                            <Clock className="w-3.5 h-3.5" />
                            {format(new Date(query.created_at), "HH:mm:ss", { locale: fr })}
                         </div>
                      </td>
                      <td className="py-7 px-10">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-[12px] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-sm uppercase">
                               {query.user_email.charAt(0)}
                            </div>
                            <span className="text-sm font-bold text-white max-w-[120px] truncate">{query.user_email.split('@')[0]}</span>
                         </div>
                      </td>
                      <td className="py-7 px-10">
                         <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-slate-300 uppercase tracking-widest leading-none">
                            {query.tenant_name}
                         </span>
                      </td>
                      <td className="py-7 px-10">
                         <p className="text-slate-400 text-sm font-medium line-clamp-1 group-hover:text-slate-200 transition-colors" title={query.question}>
                            {query.question}
                         </p>
                      </td>
                      <td className="py-7 px-10 text-right">
                         <span className="px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-[9px] font-black text-purple-400 uppercase tracking-widest">
                            {query.model_used.split('/').pop()}
                         </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

function AdminStatCard({ title, value, trend, icon: Icon, glow }: { title: string, value: number, trend: number, icon: any, glow: string }) {
  return (
    <div 
      className="relative group bg-[#131722] border border-white/5 rounded-[40px] p-8 cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:border-white/10 overflow-hidden shadow-2xl"
      style={{ boxShadow: `0 20px 40px -15px ${glow}` }}
    >
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-colors duration-500" />
      
      <div className="relative z-10 space-y-8">
        <div className="flex items-center justify-between">
           <div className="p-4 rounded-[20px] bg-white/5 border border-white/5 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/20 transition-all duration-500">
              <Icon className="w-6 h-6 text-slate-400 group-hover:text-indigo-400 transition-colors duration-500" />
           </div>
           <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <TrendingUp className="w-3 h-3" />
              <span>+{trend}</span>
           </div>
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{title}</p>
          <p className="text-4xl font-extrabold text-white tracking-tighter tabular-nums leading-none">
             {value.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Hover Line */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-brand opacity-0 group-hover:opacity-100 transition-opacity duration-500 shadow-[0_0_20px_rgba(99,102,241,0.5)]" />
    </div>
  );
}
