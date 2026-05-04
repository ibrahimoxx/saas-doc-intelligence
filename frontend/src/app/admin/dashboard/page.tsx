"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { adminService, type AdminRecentQuery } from "@/services/admin.service";
import { staggerContainer, fadeUp } from "@/lib/motion";
import {
  Users,
  Shield,
  Activity,
  Database,
  ArrowUpRight,
} from "lucide-react";

const reducedFadeUp: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const reducedStagger: Variants = { hidden: {}, visible: {} };

export default function AdminDashboardPage() {
  const shouldReduceMotion = useReducedMotion();

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
    { label: "Utilisateurs Globaux", val: stats.total_users, icon: Users, glow: "rgba(99,102,241,0.15)" },
    { label: "Organisations", val: stats.total_tenants, icon: Shield, glow: "rgba(168,85,247,0.15)" },
    { label: "Index Global (Docs)", val: stats.total_documents, icon: Database, glow: "rgba(6,182,212,0.15)" },
    { label: "Requêtes Système", val: stats.total_queries, icon: Activity, glow: "rgba(236,72,153,0.15)" },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-32">
        <div className="h-6 w-6 rounded-full border-2 border-bg-elevated-3 border-t-brand-primary animate-spin" />
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-fg-tertiary">
          Chargement…
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={shouldReduceMotion ? reducedStagger : staggerContainer}
      className="space-y-10"
    >
      {/* Header */}
      <motion.header
        variants={shouldReduceMotion ? reducedFadeUp : fadeUp}
        className="space-y-3"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-7 items-center gap-1.5 rounded-full border border-brand-primary/20 bg-brand-primary/10 px-3">
            <Shield className="h-3 w-3 text-brand-primary" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-brand-primary">
              Contrôleur Central
            </span>
          </div>
        </div>
        <h1 className="font-serif text-4xl tracking-tight text-fg-primary sm:text-5xl">
          Console de <span className="text-gradient">Supervision</span>
        </h1>
      </motion.header>

      {/* Metrics */}
      <motion.section
        variants={shouldReduceMotion ? reducedFadeUp : fadeUp}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {metricCards.map((card, i) => (
          <motion.div
            key={i}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            whileHover={shouldReduceMotion ? {} : { y: -4 }}
            className="group relative flex flex-col gap-6 overflow-hidden rounded-[28px] border border-border-subtle bg-bg-elevated-1/80 p-6 shadow-card"
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: `radial-gradient(circle at 30% 30%, ${card.glow}, transparent 70%)` }}
            />
            <div className="relative flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border-strong bg-bg-elevated-2">
                <card.icon className="h-5 w-5 text-brand-primary" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-fg-muted group-hover:text-brand-primary transition-colors" />
            </div>
            <div className="relative space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-fg-tertiary">{card.label}</p>
              <p
                className={`font-display text-5xl font-bold tabular-nums tracking-tight text-fg-primary ${
                  loading ? "animate-pulse opacity-50" : ""
                }`}
              >
                {card.val}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.section>

      {/* Recent activity */}
      <motion.section
        variants={shouldReduceMotion ? reducedFadeUp : fadeUp}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-fg-tertiary">
            Flux d'activités récentes
          </p>
        </div>

        <div className="rounded-[28px] border border-border-subtle bg-bg-elevated-1/60 overflow-hidden">
          {recentQueries.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-xs font-semibold uppercase tracking-widest text-fg-muted">
              Aucune requête enregistrée
            </div>
          ) : (
            <div className="divide-y divide-border-subtle">
              {recentQueries.map((q, i) => (
                <motion.div
                  key={q.id}
                  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="flex items-center justify-between gap-4 px-6 py-4"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-border-strong bg-bg-elevated-2">
                      <Activity className="h-4 w-4 text-brand-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-fg-primary max-w-md">
                        {q.question}
                      </p>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-fg-tertiary">
                        {q.user_email} · {q.tenant_name}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-lg border border-border-subtle bg-bg-elevated-2 px-2 py-1 font-mono text-[10px] text-fg-tertiary">
                    {q.model_used}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.section>
    </motion.div>
  );
}
