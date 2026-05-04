"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { adminService } from "@/services/admin.service";
import type { AdminTenant } from "@/types/admin.types";
import { staggerContainer, fadeUp } from "@/lib/motion";
import {
  Shield,
  Plus,
  X,
  Loader2,
  ChevronRight,
  Users,
  Database,
  Layers,
  Search,
} from "lucide-react";

const reducedFadeUp = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const reducedStagger = { hidden: {}, visible: {} };

const STATUS_BADGE: Record<string, string> = {
  active: "border-success/20 bg-success/10 text-success",
  suspended: "border-error/20 bg-error/10 text-error",
  trial: "border-warning/20 bg-warning/10 text-warning",
};
const STATUS_LABEL: Record<string, string> = { active: "Actif", suspended: "Suspendu", trial: "Essai" };

const FILTERS = [
  { label: "Tous", value: "" },
  { label: "Actif", value: "active" },
  { label: "Suspendu", value: "suspended" },
];

export default function AdminTenantsPage() {
  const shouldReduceMotion = useReducedMotion();

  const [tenants, setTenants] = useState<AdminTenant[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", owner_email: "" });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (q: string, status: string) => {
    setLoading(true);
    const res = await adminService.listTenants({ search: q || undefined, status: status || undefined });
    if (res.data) { setTenants(res.data.results); setTotal(res.data.count); }
    setLoading(false);
  }, []);

  useEffect(() => { load(search, statusFilter); }, [statusFilter, load]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => load(val, statusFilter), 400);
  };

  const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  const handleNameChange = (val: string) => {
    setForm((f) => ({ ...f, name: val, slug: slugify(val) }));
  };

  const handleCreate = async () => {
    if (!form.name.trim() || !form.slug.trim() || !form.owner_email.trim()) return;
    setCreating(true);
    setCreateError(null);
    const res = await adminService.createTenant(form);
    if (res.error) {
      setCreateError(res.error.message);
    } else {
      const msg = res.data?.owner_assigned ? "Propriétaire assigné." : "Invitation envoyée au propriétaire.";
      setSuccessMsg(msg);
      await load(search, statusFilter);
      setTimeout(() => {
        setShowModal(false);
        setForm({ name: "", slug: "", owner_email: "" });
        setSuccessMsg(null);
      }, 1500);
    }
    setCreating(false);
  };

  const closeModal = () => {
    if (creating) return;
    setShowModal(false);
    setForm({ name: "", slug: "", owner_email: "" });
    setCreateError(null);
    setSuccessMsg(null);
  };

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
        className="flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-3xl tracking-tight text-fg-primary">Organisations</h1>
          {!loading && (
            <span className="rounded-full border border-border-subtle bg-bg-elevated-2 px-2.5 py-1 text-[10px] font-semibold text-fg-tertiary">
              {total}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-2xl aurora-bg px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(99,102,241,0.5)] transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Nouvelle Organisation
        </button>
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
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Rechercher..."
            className="rounded-2xl border border-border-subtle bg-bg-elevated-1 pl-9 pr-4 py-2.5 text-sm text-fg-primary placeholder:text-fg-tertiary focus:border-brand-primary/50 focus:outline-none transition-colors w-56"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                statusFilter === f.value
                  ? "border-brand-primary/30 bg-brand-primary/15 text-brand-primary"
                  : "border-border-subtle bg-bg-elevated-1 text-fg-tertiary hover:text-fg-primary"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* List */}
      <motion.div variants={shouldReduceMotion ? reducedFadeUp : fadeUp}>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 rounded-full border-2 border-bg-elevated-3 border-t-brand-primary animate-spin" />
          </div>
        ) : tenants.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-sm font-semibold text-fg-tertiary">
            Aucune organisation trouvée.
          </div>
        ) : (
          <div className="space-y-2">
            {tenants.map((t, i) => (
              <motion.div
                key={t.id}
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-4 rounded-[20px] border border-border-subtle bg-bg-elevated-1/60 px-5 py-4 transition-colors hover:border-border-strong"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl aurora-bg shadow-[0_4px_12px_-4px_rgba(99,102,241,0.4)]">
                  <Shield className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-fg-primary truncate">{t.name}</p>
                    <span className={`shrink-0 rounded-lg border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${STATUS_BADGE[t.status] ?? STATUS_BADGE.active}`}>
                      {STATUS_LABEL[t.status] ?? t.status}
                    </span>
                  </div>
                  <p className="font-mono text-[10px] text-fg-tertiary">{t.slug}</p>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-semibold text-fg-tertiary">
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" />{t.member_count}</span>
                  <span className="flex items-center gap-1"><Layers className="h-3 w-3" />{t.space_count}</span>
                  <span className="flex items-center gap-1"><Database className="h-3 w-3" />{t.document_count}</span>
                </div>
                <Link
                  href={`/admin/tenants/${t.id}`}
                  className="flex items-center gap-1.5 rounded-xl border border-border-subtle bg-bg-elevated-2 px-3 py-1.5 text-xs font-semibold text-fg-tertiary transition-colors hover:text-fg-primary"
                >
                  Voir <ChevronRight className="h-3 w-3" />
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Create modal */}
      {showModal && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 flex items-center justify-center p-6"
          >
            <div className="absolute inset-0 bg-bg-base/90 backdrop-blur-sm" onClick={closeModal} />
            <motion.div
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.25 }}
              className="relative w-full max-w-lg rounded-[28px] border border-border-strong bg-bg-elevated-1 p-8 shadow-card-lift"
            >
              <div className="absolute inset-x-0 top-0 h-0.5 aurora-bg rounded-t-[28px]" />

              <div className="mb-6 flex items-start justify-between">
                <h2 className="font-serif text-2xl text-fg-primary">Nouvelle Organisation</h2>
                <button
                  onClick={closeModal}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-border-subtle text-fg-tertiary transition-colors hover:text-fg-primary"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {successMsg ? (
                <div className="flex flex-col items-center gap-4 py-8 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-success/20 bg-success/10">
                    <Shield className="h-6 w-6 text-success" />
                  </div>
                  <p className="font-display font-semibold text-fg-primary">Organisation créée !</p>
                  <p className="text-sm text-fg-secondary">{successMsg}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-widest text-fg-tertiary">Nom</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="w-full rounded-2xl border border-border-subtle bg-bg-elevated-2 px-4 py-3 text-sm text-fg-primary placeholder:text-fg-tertiary focus:border-brand-primary/50 focus:outline-none transition-colors"
                      placeholder="Acme Corp"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-widest text-fg-tertiary">Slug</label>
                    <input
                      type="text"
                      value={form.slug}
                      onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
                      className="w-full rounded-2xl border border-border-subtle bg-bg-elevated-2 px-4 py-3 font-mono text-sm text-fg-primary placeholder:text-fg-tertiary focus:border-brand-primary/50 focus:outline-none transition-colors"
                      placeholder="acme-corp"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-widest text-fg-tertiary">Email du propriétaire</label>
                    <input
                      type="email"
                      value={form.owner_email}
                      onChange={(e) => setForm((f) => ({ ...f, owner_email: e.target.value }))}
                      className="w-full rounded-2xl border border-border-subtle bg-bg-elevated-2 px-4 py-3 text-sm text-fg-primary placeholder:text-fg-tertiary focus:border-brand-primary/50 focus:outline-none transition-colors"
                      placeholder="owner@company.com"
                    />
                  </div>
                  {createError && (
                    <div className="rounded-2xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
                      {createError}
                    </div>
                  )}
                  <button
                    onClick={handleCreate}
                    disabled={creating || !form.name.trim() || !form.owner_email.trim()}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl aurora-bg py-3 text-sm font-semibold text-white shadow-[0_4px_16px_-4px_rgba(99,102,241,0.5)] transition-opacity disabled:opacity-30"
                  >
                    {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Créer l'Organisation"}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </motion.div>
  );
}
