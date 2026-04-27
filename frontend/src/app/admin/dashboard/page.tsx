// src/app/admin/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { adminService, type AdminRecentQuery } from "@/services/admin.service";
import { 
  Users, 
  Shield, 
  Activity, 
  Database,
  ArrowUpRight,
  ChevronRight,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    total_users: 0,
    total_tenants: 0,
    total_documents: 0,
    total_queries: 0,
  });
  const [recentQueries, setRecentQueries] = useState<AdminRecentQuery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminService.getAdminStats(),
      adminService.getRecentQueries(),
    ]).then(([statsRes, queriesRes]) => {
      if (statsRes.data?.totals) {
        setStats({
          total_users: statsRes.data.totals.users,
          total_tenants: statsRes.data.totals.tenants,
          total_documents: statsRes.data.totals.documents,
          total_queries: statsRes.data.totals.queries,
        });
      }
      if (queriesRes.data) setRecentQueries(queriesRes.data);
      setLoading(false);
    });
  }, []);

  const metricCards = [
    { label: "Utilisateurs Globaux", val: stats.total_users, icon: Users, color: "#6366f1" },
    { label: "Organisations", val: stats.total_tenants, icon: Shield, color: "#a855f7" },
    { label: "Index Global (Docs)", val: stats.total_documents, icon: Database, color: "#06b6d4" },
    { label: "Requêtes Système", val: stats.total_queries, icon: Activity, color: "#ec4899" },
  ];

  if (loading) {
    return (
      <div className="py-48 flex flex-col items-center justify-center gap-8">
        <div className="w-16 h-16 border-4 border-white/5 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600">Initialisation du Noyau...</p>
      </div>
    );
  }

  return (
    <div className="space-y-24">
      {/* Header Area */}
      <header className="space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] uppercase font-black tracking-[0.3em] text-indigo-400">
          <Shield className="w-3.5 h-3.5" />
          <span>Contrôleur Central</span>
        </div>
        <h2 className="text-6xl font-black tracking-tighter text-white">
           Console de <br />
           <span className="text-gradient">Supervision</span>
        </h2>
      </header>

      {/* Metrics Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        {metricCards.map((card, i) => (
          <div 
            key={i} 
            className="fluid-card group"
            style={{ animationDelay: `${(i+1)*100}ms` }}
          >
             <div className="flex flex-col gap-8">
                <div className="flex items-center justify-between">
                   <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-indigo-500/10 transition-all">
                      <card.icon className="w-6 h-6" style={{ color: card.color }} />
                   </div>
                   <div className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center text-slate-600 group-hover:text-white transition-all">
                      <ArrowUpRight className="w-4 h-4" />
                   </div>
                </div>

                <div className="space-y-1">
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">{card.label}</p>
                   <p className="text-6xl font-black text-white tracking-tighter tabular-nums">{card.val}</p>
                </div>
             </div>
          </div>
        ))}
      </section>

      {/* Recent Activity Table (Placeholder Look) */}
      <section className="space-y-8 pb-20">
         <div className="flex items-center justify-between px-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Flux d'activités récentes</h3>
            <button className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 hover:text-white transition-colors flex items-center gap-2">
               Voir tout l'historique <ChevronRight className="w-3.5 h-3.5" />
            </button>
         </div>

         <div className="space-y-4">
            {recentQueries.length === 0 ? (
              <div className="fluid-card py-16 text-center text-slate-600 text-[10px] font-black uppercase tracking-widest">
                Aucune requête enregistrée
              </div>
            ) : recentQueries.map((q, i) => (
              <div
                key={q.id}
                className="fluid-card flex items-center justify-between py-8 px-12 hover:-translate-x-1"
                style={{ animationDelay: `${(i+5)*100}ms` }}
              >
                <div className="flex items-center gap-6 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0">
                    <Activity className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-black text-white truncate max-w-xl">{q.question}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                      {q.user_email} • {q.tenant_name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-[9px] font-black text-slate-500 uppercase">
                    {q.model_used}
                  </div>
                </div>
              </div>
            ))}
         </div>
      </section>
    </div>
  );
}
