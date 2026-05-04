"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { adminService } from "@/services/admin.service";
import type { AdminUser } from "@/types/admin.types";
import { staggerContainer, fadeUp } from "@/lib/motion";
import { Loader2, ShieldCheck, Users, Search } from "lucide-react";

const reducedFadeUp = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const reducedStagger = { hidden: {}, visible: {} };

const PAGE_SIZE = 20;
const ACTIVE_FILTERS: { label: string; value: "" | "true" | "false" }[] = [
  { label: "Tous", value: "" },
  { label: "Actifs", value: "true" },
  { label: "Désactivés", value: "false" },
];

export default function AdminUsersPage() {
  const { user: me } = useAuth();
  const shouldReduceMotion = useReducedMotion();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState<"" | "true" | "false">("");
  const [filterSuper, setFilterSuper] = useState<"" | "true">("");
  const [toggling, setToggling] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (q: string, active: string, sup: string, p: number) => {
    setLoading(true);
    const res = await adminService.listUsers({
      search: q || undefined,
      is_active: active !== "" ? active === "true" : undefined,
      is_superuser: sup !== "" ? sup === "true" : undefined,
      page: p,
    });
    if (res.data) { setUsers(res.data.results); setTotal(res.data.count); }
    setLoading(false);
  }, []);

  useEffect(() => { load(search, filterActive, filterSuper, page); }, [filterActive, filterSuper, page, load]);

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => load(val, filterActive, filterSuper, 1), 400);
  };

  const handleToggleActive = async (u: AdminUser) => {
    setToggling(u.id);
    await adminService.updateUser(u.id, { is_active: !u.is_active });
    await load(search, filterActive, filterSuper, page);
    setToggling(null);
  };

  const handleToggleSuper = async (u: AdminUser) => {
    setToggling(u.id);
    await adminService.updateUser(u.id, { is_superuser: !u.is_superuser });
    await load(search, filterActive, filterSuper, page);
    setToggling(null);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={shouldReduceMotion ? reducedStagger : staggerContainer}
      className="space-y-8"
    >
      {/* Header */}
      <motion.div
        variants={shouldReduceMotion ? reducedFadeUp : fadeUp}
        className="flex items-center gap-3"
      >
        <h1 className="font-serif text-3xl tracking-tight text-fg-primary">Utilisateurs</h1>
        {!loading && (
          <span className="rounded-full border border-border-subtle bg-bg-elevated-2 px-2.5 py-1 text-[10px] font-semibold text-fg-tertiary">
            {total}
          </span>
        )}
      </motion.div>

      {/* Filters */}
      <motion.div
        variants={shouldReduceMotion ? reducedFadeUp : fadeUp}
        className="flex flex-wrap items-center gap-3"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-fg-tertiary" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Rechercher par email ou nom..."
            className="rounded-2xl border border-border-subtle bg-bg-elevated-1 pl-9 pr-4 py-2.5 text-sm text-fg-primary placeholder:text-fg-tertiary focus:border-brand-primary/50 focus:outline-none transition-colors w-72"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {ACTIVE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setFilterActive(f.value); setPage(1); }}
              className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                filterActive === f.value
                  ? "border-brand-primary/30 bg-brand-primary/15 text-brand-primary"
                  : "border-border-subtle bg-bg-elevated-1 text-fg-tertiary hover:text-fg-primary"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => { setFilterSuper(filterSuper === "true" ? "" : "true"); setPage(1); }}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
            filterSuper === "true"
              ? "border-warning/20 bg-warning/10 text-warning"
              : "border-border-subtle bg-bg-elevated-1 text-fg-tertiary hover:text-fg-primary"
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          Super Owner
        </button>
      </motion.div>

      {/* List */}
      <motion.div variants={shouldReduceMotion ? reducedFadeUp : fadeUp}>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 rounded-full border-2 border-bg-elevated-3 border-t-brand-primary animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-sm font-semibold text-fg-tertiary">
            Aucun utilisateur trouvé.
          </div>
        ) : (
          <div className="space-y-2">
            {users.map((u, i) => {
              const isMe = me?.id === u.id;
              const isBusy = toggling === u.id;
              return (
                <motion.div
                  key={u.id}
                  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`flex items-center gap-4 rounded-[20px] border bg-bg-elevated-1/60 px-5 py-4 transition-colors ${
                    isMe ? "border-brand-primary/20 bg-brand-primary/5" : "border-border-subtle hover:border-border-strong"
                  }`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl aurora-bg text-sm font-bold text-white">
                    {u.email[0].toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-fg-primary truncate">{u.email}</p>
                      {u.is_superuser && (
                        <span className="flex items-center gap-1 rounded-lg border border-warning/20 bg-warning/10 px-2 py-0.5 text-[9px] font-bold uppercase text-warning">
                          <ShieldCheck className="h-2.5 w-2.5" /> Super Owner
                        </span>
                      )}
                      {isMe && (
                        <span className="rounded-lg border border-brand-primary/20 bg-brand-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase text-brand-primary">
                          Vous
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <p className="text-[10px] text-fg-tertiary">{u.full_name || "—"}</p>
                      <span className="flex items-center gap-1 text-[10px] text-fg-tertiary">
                        <Users className="h-2.5 w-2.5" />{u.membership_count}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 justify-end">
                    <span className={`rounded-lg border px-2.5 py-1 text-[9px] font-bold uppercase ${
                      u.is_active
                        ? "border-success/20 bg-success/10 text-success"
                        : "border-error/20 bg-error/10 text-error"
                    }`}>
                      {u.is_active ? "Actif" : "Désactivé"}
                    </span>

                    {!isMe && (
                      <>
                        <button
                          onClick={() => handleToggleActive(u)}
                          disabled={isBusy}
                          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                            u.is_active
                              ? "border-error/20 bg-error/5 text-error hover:bg-error/10"
                              : "border-success/20 bg-success/5 text-success hover:bg-success/10"
                          }`}
                        >
                          {isBusy && <Loader2 className="h-3 w-3 animate-spin" />}
                          {u.is_active ? "Désactiver" : "Réactiver"}
                        </button>
                        <button
                          onClick={() => handleToggleSuper(u)}
                          disabled={isBusy}
                          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                            u.is_superuser
                              ? "border-warning/20 bg-warning/5 text-warning hover:bg-warning/10"
                              : "border-border-subtle bg-bg-elevated-2 text-fg-tertiary hover:text-fg-primary"
                          }`}
                        >
                          {isBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldCheck className="h-3 w-3" />}
                          {u.is_superuser ? "Révoquer" : "Promouvoir"}
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div
          variants={shouldReduceMotion ? reducedFadeUp : fadeUp}
          className="flex items-center justify-center gap-3 pt-2"
        >
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-xl border border-border-subtle bg-bg-elevated-2 px-4 py-2 text-xs font-semibold text-fg-tertiary transition-colors hover:text-fg-primary disabled:opacity-30"
          >
            Précédent
          </button>
          <span className="text-xs font-semibold text-fg-tertiary">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-xl border border-border-subtle bg-bg-elevated-2 px-4 py-2 text-xs font-semibold text-fg-tertiary transition-colors hover:text-fg-primary disabled:opacity-30"
          >
            Suivant
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
