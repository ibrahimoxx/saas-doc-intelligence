"use client";

import { useState, useEffect } from "react";
import { adminService, AdminStatsResponse, AdminRecentQuery } from "@/services/admin.service";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import {
  UsersIcon,
  FolderOpenIcon,
  ChatBubbleBottomCenterTextIcon,
  BuildingOffice2Icon,
} from "@heroicons/react/24/outline";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [recentQueries, setRecentQueries] = useState<AdminRecentQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAdminData() {
      try {
        setLoading(true);
        // Fetch stats and queries in parallel
        const [statsRes, queriesRes] = await Promise.all([
          adminService.getAdminStats(),
          adminService.getRecentQueries(),
        ]);

        if (statsRes.error) throw new Error(statsRes.error.message || "Failed to load stats");
        if (queriesRes.error) throw new Error(queriesRes.error.message || "Failed to load queries");

        setStats(statsRes.data!);
        setRecentQueries(queriesRes.data!);
        
      } catch (err: any) {
        console.error("Admin dashboard error:", err);
        setError(err.message || "Erreur lors du chargement des statistiques.");
      } finally {
        setLoading(false);
      }
    }

    loadAdminData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
            Platform <span className="text-gradient">Overview</span>
          </h1>
          <p className="text-slate-400 font-medium flex items-center">
            <span className="w-2 h-2 rounded-full bg-indigo-500 mr-2 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></span>
            Superuser statistics and real-time monitoring
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-slate-800/40 p-1 rounded-xl border border-slate-700/50 backdrop-blur-sm">
          <button className="px-4 py-1.5 rounded-lg bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/20">7 Days</button>
          <button className="px-4 py-1.5 rounded-lg text-slate-400 text-xs font-bold hover:text-white transition-colors">30 Days</button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Tenants"
            value={stats.totals.tenants}
            trend={`+${stats.recent_activity.new_tenants_7d} this week`}
            icon={BuildingOffice2Icon}
            color="from-blue-500 to-indigo-600 shadow-blue-500/10"
          />
          <StatCard
            title="Total Users"
            value={stats.totals.users}
            trend={`+${stats.recent_activity.new_users_7d} this week`}
            icon={UsersIcon}
            color="from-purple-500 to-pink-600 shadow-purple-500/10"
          />
          <StatCard
            title="Total Documents"
            value={stats.totals.documents}
            trend={`+${stats.recent_activity.new_documents_7d} this week`}
            icon={FolderOpenIcon}
            color="from-amber-400 to-orange-600 shadow-amber-500/10"
          />
          <StatCard
            title="Total Queries"
            value={stats.totals.queries}
            trend={`+${stats.recent_activity.queries_7d} this week`}
            icon={ChatBubbleBottomCenterTextIcon}
            color="from-emerald-400 to-teal-600 shadow-emerald-500/10"
          />
        </div>
      )}

      {/* Recent Queries Table */}
      <div className="glass-card rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
        <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div>
            <h2 className="text-xl font-bold text-white">Recent RAG Queries</h2>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">Latest user interactions</p>
          </div>
          <button className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/10 px-4 py-2 rounded-xl border border-indigo-500/20 shadow-inner">
            View All
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/5">
            <thead className="bg-white/[0.01]">
              <tr>
                <th scope="col" className="px-8 py-5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Timestamp
                </th>
                <th scope="col" className="px-8 py-5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  User
                </th>
                <th scope="col" className="px-8 py-5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Tenant
                </th>
                <th scope="col" className="px-8 py-5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Question
                </th>
                <th scope="col" className="px-8 py-5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Engine
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-transparent">
              {recentQueries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="p-4 rounded-full bg-slate-800/50 text-slate-600">
                        <ChatBubbleBottomCenterTextIcon className="w-8 h-8" />
                      </div>
                      <p className="text-slate-500 font-medium">No queries recorded yet.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                recentQueries.map((query) => (
                  <tr key={query.id} className="group hover:bg-white/[0.02] transition-colors duration-200">
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-300">
                        {format(new Date(query.created_at), "dd MMM, HH:mm", { locale: fr })}
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs font-bold mr-3">
                          {query.user_email.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold text-white truncate max-w-[120px]">
                          {query.user_email.split("@")[0]}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700/50">
                        {query.tenant_name}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-sm text-slate-400 line-clamp-1 group-hover:text-slate-200 transition-colors" title={query.question}>
                        {query.question}
                      </p>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-sm">
                        {query.model_used.split("/").pop()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  trend, 
  icon: Icon,
  color
}: { 
  title: string; 
  value: number; 
  trend: string; 
  icon: any;
  color: string;
}) {
  return (
    <div className="glass-card rounded-3xl p-7 flex flex-col justify-between transition-all duration-300 hover:translate-y-[-5px] hover:border-indigo-500/30 group">
      <div className="flex items-center justify-between mb-8">
        <div className={`p-3 rounded-2xl bg-gradient-to-br ${color} text-white shadow-lg`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-indigo-400 transition-colors">
          Realtime
        </div>
      </div>
      <div>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <div className="flex items-end space-x-2">
          <p className="text-4xl font-black text-white tracking-tight leading-none">{value.toLocaleString()}</p>
        </div>
        <div className="mt-4 flex items-center space-x-2">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 10l7-7 7 7M5 19l7-7 7 7"></path></svg>
          </span>
          <p className="text-xs font-bold text-emerald-500 tracking-wide">{trend}</p>
        </div>
      </div>
    </div>
  );
}
