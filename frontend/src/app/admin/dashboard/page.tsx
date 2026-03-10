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
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">Platform Overview</h1>
        <p className="text-indigo-200/60 mt-2">Superuser statistics and monitoring</p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Tenants"
            value={stats.totals.tenants}
            trend={`+${stats.recent_activity.new_tenants_7d} (7j)`}
            icon={BuildingOffice2Icon}
            color="bg-blue-100 text-blue-600"
          />
          <StatCard
            title="Total Users"
            value={stats.totals.users}
            trend={`+${stats.recent_activity.new_users_7d} (7j)`}
            icon={UsersIcon}
            color="bg-purple-100 text-purple-600"
          />
          <StatCard
            title="Total Documents"
            value={stats.totals.documents}
            trend={`+${stats.recent_activity.new_documents_7d} (7j)`}
            icon={FolderOpenIcon}
            color="bg-amber-100 text-amber-600"
          />
          <StatCard
            title="Total Queries"
            value={stats.totals.queries}
            trend={`+${stats.recent_activity.queries_7d} (7j)`}
            icon={ChatBubbleBottomCenterTextIcon}
            color="bg-emerald-100 text-emerald-600"
          />
        </div>
      )}

      {/* Recent Queries Table */}
      <div className="bg-[rgba(30,27,75,0.4)] backdrop-blur-sm rounded-xl border border-indigo-500/15 shadow-[0_4px_20px_rgba(30,27,75,0.5)] overflow-hidden">
        <div className="px-6 py-5 border-b border-indigo-500/15">
          <h2 className="text-lg font-semibold text-[#e2e8f0]">Recent RAG Queries</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-indigo-500/10">
            <thead className="bg-[#0f172a]/50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                  User
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                  Tenant
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                  Question
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                  Model
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-500/10">
              {recentQueries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-500">
                    Aucune requête enregistrée.
                  </td>
                </tr>
              ) : (
                recentQueries.map((query) => (
                  <tr key={query.id} className="hover:bg-indigo-500/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                      {format(new Date(query.created_at), "dd MMM yyyy, HH:mm", { locale: fr })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#e2e8f0]">
                      {query.user_email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                        {query.tenant_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300 max-w-sm" title={query.question}>
                      <span className="line-clamp-2">{query.question}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20">
                        {query.model_used}
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
    <div className="bg-[rgba(30,27,75,0.4)] backdrop-blur-sm rounded-xl p-6 border border-indigo-500/15 shadow-[0_4px_20px_rgba(30,27,75,0.5)] flex items-start space-x-4 transition-all hover:border-indigo-500/30 hover:bg-[rgba(30,27,75,0.6)]">
      <div className={`p-4 rounded-xl flex-shrink-0 ${color} bg-opacity-10 w-14 h-14 flex items-center justify-center`}>
        <Icon className="w-7 h-7" />
      </div>
      <div>
        <p className="text-sm font-medium text-indigo-200/60 uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-bold text-[#e2e8f0] mt-1">{value}</p>
        <p className="text-xs font-medium text-emerald-400 mt-2 flex items-center">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
          {trend}
        </p>
      </div>
    </div>
  );
}
