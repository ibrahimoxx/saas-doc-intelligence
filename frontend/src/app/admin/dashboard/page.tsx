"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminService, type AdminRecentQuery } from "@/services/admin.service";
import {
  Users,
  Shield,
  Activity,
  Database,
  ArrowUpRight,
  Loader2,
} from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();

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
    { label: "Utilisateurs", val: stats.total_users, icon: Users, href: "/admin/users" },
    { label: "Organisations", val: stats.total_tenants, icon: Shield, href: "/admin/tenants" },
    { label: "Documents indexés", val: stats.total_documents, icon: Database, href: "/admin/tenants" },
    { label: "Requêtes système", val: stats.total_queries, icon: Activity, href: "/admin/activites" },
  ];

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-32">
        <Loader2 className="h-5 w-5 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="px-8 pb-12 pt-7">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-[22px] font-bold text-fg-primary">Vue d&apos;ensemble</h1>
        <p className="mt-1 text-[13px] text-fg-secondary">
          Supervision de la plateforme — tous tenants confondus
        </p>
      </div>

      {/* Metrics */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metricCards.map((card) => (
          <button
            key={card.label}
            type="button"
            onClick={() => router.push(card.href)}
            className="dc-card group px-4 py-3.5 text-left transition-colors hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="dc-label">{card.label}</span>
              <card.icon className="h-4 w-4 shrink-0 text-fg-tertiary" />
            </div>
            <div className="mt-2 text-[21px] font-bold tabular-nums text-fg-primary">{card.val}</div>
            <div className="mt-1.5 flex items-center gap-1 text-[12px] font-semibold text-fg-tertiary transition-colors group-hover:text-brand-primary">
              Détails
              <ArrowUpRight className="h-3 w-3" />
            </div>
          </button>
        ))}
      </div>

      {/* Recent activity */}
      <div className="dc-card overflow-hidden">
        <div className="dc-panel-header">
          <span>Journal d&apos;activité plateforme</span>
          <button
            type="button"
            onClick={() => router.push("/admin/activites")}
            className="flex items-center gap-1 text-[12px] font-semibold text-brand-primary"
          >
            Voir tout
            <ArrowUpRight className="h-3 w-3" />
          </button>
        </div>

        {recentQueries.length === 0 ? (
          <div className="flex items-center justify-center py-14 text-[12.5px] text-fg-tertiary">
            Aucune requête enregistrée
          </div>
        ) : (
          <div>
            {recentQueries.map((q) => (
              <div
                key={q.id}
                className="flex items-baseline gap-3.5 border-b border-border-subtle px-4 py-2.5 last:border-b-0"
              >
                <span className="w-[190px] shrink-0 truncate font-mono text-[10.5px] text-fg-tertiary">
                  {q.user_email}
                </span>
                <span className="min-w-0 flex-1 truncate text-[12px] text-fg-secondary">
                  <span className="font-semibold text-fg-primary">{q.tenant_name}</span> ·{" "}
                  {q.question}
                </span>
                <span className="dc-badge shrink-0 font-mono text-[10.5px]">{q.model_used}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
