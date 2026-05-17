"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { adminService, type AdminRecentQuery } from "@/services/admin.service";
import { staggerContainer, fadeUp } from "@/lib/motion";
import { Activity, ArrowLeft, Search } from "lucide-react";

const reducedFadeUp: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const reducedStagger: Variants = { hidden: {}, visible: {} };

export default function AdminActivitesPage() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  const [queries, setQueries] = useState<AdminRecentQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    adminService.getRecentQueries(500).then((res) => {
      if (res.data) setQueries(res.data);
      setLoading(false);
    });
  }, []);

  const filtered = queries.filter((q) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      q.question.toLowerCase().includes(s) ||
      q.user_email.toLowerCase().includes(s) ||
      q.tenant_name.toLowerCase().includes(s)
    );
  });

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={shouldReduceMotion ? reducedStagger : staggerContainer}
      className="space-y-8"
    >
      {/* Header */}
      <motion.header
        variants={shouldReduceMotion ? reducedFadeUp : fadeUp}
        className="space-y-4"
      >
        <button
          onClick={() => router.push("/admin/dashboard")}
          className="flex items-center gap-2 text-xs font-semibold text-fg-tertiary hover:text-fg-primary transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Console de Supervision
        </button>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-fg-tertiary mb-2">
            Historique complet
          </p>
          <h1 className="font-serif text-4xl tracking-tight text-fg-primary">
            Flux d&apos;<span className="text-gradient">Activités</span>
          </h1>
        </div>
      </motion.header>

      {/* Search + count */}
      <motion.div
        variants={shouldReduceMotion ? reducedFadeUp : fadeUp}
        className="flex items-center gap-4"
      >
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-tertiary pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrer par question, email, organisation…"
            className="w-full rounded-2xl border border-border-subtle bg-bg-elevated-1 py-2.5 pl-9 pr-4 text-sm text-fg-primary placeholder:text-fg-tertiary focus:border-brand-primary/50 focus:outline-none transition-colors"
          />
        </div>
        <p className="text-xs text-fg-tertiary shrink-0">
          {loading ? "…" : `${filtered.length} activité${filtered.length !== 1 ? "s" : ""}`}
        </p>
      </motion.div>

      {/* Table */}
      <motion.section variants={shouldReduceMotion ? reducedFadeUp : fadeUp}>
        <div className="rounded-[28px] border border-border-subtle bg-bg-elevated-1/60 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-6 w-6 rounded-full border-2 border-bg-elevated-3 border-t-brand-primary animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-xs font-semibold uppercase tracking-widest text-fg-muted">
              Aucune activité trouvée
            </div>
          ) : (
            <div className="divide-y divide-border-subtle">
              {/* Column headers */}
              <div className="grid grid-cols-[1fr_160px_140px_100px] gap-4 px-6 py-3 bg-bg-elevated-2/60">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-fg-tertiary">Question</p>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-fg-tertiary">Utilisateur</p>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-fg-tertiary">Organisation</p>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-fg-tertiary">Modèle</p>
              </div>

              {filtered.map((q, i) => (
                <motion.div
                  key={q.id}
                  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.4) }}
                  className="grid grid-cols-[1fr_160px_140px_100px] gap-4 items-center px-6 py-4 hover:bg-bg-elevated-2/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border-strong bg-bg-elevated-2">
                      <Activity className="h-3.5 w-3.5 text-brand-primary" />
                    </div>
                    <p className="truncate text-sm font-semibold text-fg-primary">
                      {q.question}
                    </p>
                  </div>
                  <p className="truncate text-xs text-fg-secondary">{q.user_email}</p>
                  <p className="truncate text-xs text-fg-secondary">{q.tenant_name}</p>
                  <span className="rounded-lg border border-border-subtle bg-bg-elevated-2 px-2 py-1 font-mono text-[10px] text-fg-tertiary w-fit">
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
