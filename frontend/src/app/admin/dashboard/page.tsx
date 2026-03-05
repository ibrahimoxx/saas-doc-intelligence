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
        <h1 className="text-2xl font-bold text-slate-900">Platform Overview</h1>
        <p className="text-slate-500 mt-1">Superuser statistics and monitoring</p>
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
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Recent RAG Queries</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  User
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Tenant
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Question
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Model
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {recentQueries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">
                    Aucune requête enregistrée.
                  </td>
                </tr>
              ) : (
                recentQueries.map((query) => (
                  <tr key={query.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {format(new Date(query.created_at), "dd MMM yyyy, HH:mm", { locale: fr })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {query.user_email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                        {query.tenant_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 max-w-sm truncate" title={query.question}>
                      {query.question}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
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
    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex items-start space-x-4">
      <div className={`p-3 rounded-lg flex-shrink-0 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
        <p className="text-xs font-medium text-slate-400 mt-1">{trend}</p>
      </div>
    </div>
  );
}
