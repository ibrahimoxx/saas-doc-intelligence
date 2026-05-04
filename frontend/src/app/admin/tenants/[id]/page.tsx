"use client";

import { use, useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { adminService } from "@/services/admin.service";
import type { AdminTenantDetail } from "@/types/admin.types";
import { staggerContainer, fadeUp } from "@/lib/motion";
import {
  ChevronLeft,
  Users,
  Layers,
  Database,
  Loader2,
  X,
  ShieldCheck,
  Shield,
} from "lucide-react";

const reducedFadeUp = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const reducedStagger = { hidden: {}, visible: {} };

const ROLE_BADGE: Record<string, string> = {
  owner: "border-warning/20 bg-warning/10 text-warning",
  admin: "border-brand-primary/20 bg-brand-primary/10 text-brand-primary",
  manager: "border-info/20 bg-info/10 text-info",
  member: "border-border-subtle bg-bg-elevated-2 text-fg-tertiary",
};
const STATUS_BADGE: Record<string, string> = {
  active: "border-success/20 bg-success/10 text-success",
  disabled: "border-error/20 bg-error/10 text-error",
  invited: "border-warning/20 bg-warning/10 text-warning",
};

export default function AdminTenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const shouldReduceMotion = useReducedMotion();

  const [tenant, setTenant] = useState<AdminTenantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [patching, setPatching] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({ user_email: "", role: "member" });
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await adminService.getTenant(id);
    if (res.data) setTenant(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const handleStatusToggle = async () => {
    if (!tenant) return;
    setPatching(true);
    const newStatus = tenant.status === "suspended" ? "active" : "suspended";
    const res = await adminService.updateTenantStatus(id, newStatus);
    if (res.data) setTenant((prev) => prev ? { ...prev, status: res.data!.status } : prev);
    setPatching(false);
  };

  const handleAssign = async () => {
    if (!assignForm.user_email.trim()) return;
    setAssigning(true);
    setAssignError(null);
    const res = await adminService.assignMembership(id, assignForm.user_email, assignForm.role);
    if (res.error) {
      setAssignError(res.error.message);
    } else {
      setShowAssignModal(false);
      setAssignForm({ user_email: "", role: "member" });
      await load();
    }
    setAssigning(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 rounded-full border-2 border-bg-elevated-3 border-t-brand-primary animate-spin" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="flex items-center justify-center py-24 text-sm font-semibold text-fg-tertiary">
        Organisation introuvable.
      </div>
    );
  }

  const isSuspended = tenant.status === "suspended";

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={shouldReduceMotion ? reducedStagger : staggerContainer}
      className="space-y-8"
    >
      {/* Breadcrumb */}
      <motion.div variants={shouldReduceMotion ? reducedFadeUp : fadeUp}>
        <Link
          href="/admin/tenants"
          className="flex items-center gap-1.5 text-xs font-semibold text-fg-tertiary hover:text-fg-primary transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Organisations
        </Link>
      </motion.div>

      {/* Header */}
      <motion.div
        variants={shouldReduceMotion ? reducedFadeUp : fadeUp}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-3xl tracking-tight text-fg-primary">{tenant.name}</h1>
          <span
            className={`rounded-lg border px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest ${
              isSuspended
                ? "border-error/20 bg-error/10 text-error"
                : "border-success/20 bg-success/10 text-success"
            }`}
          >
            {isSuspended ? "Suspendu" : "Actif"}
          </span>
        </div>
        <button
          onClick={handleStatusToggle}
          disabled={patching}
          className={`flex items-center gap-2 rounded-2xl border px-4 py-2 text-xs font-semibold transition-colors disabled:opacity-50 ${
            isSuspended
              ? "border-success/20 bg-success/10 text-success hover:bg-success/20"
              : "border-error/20 bg-error/10 text-error hover:bg-error/20"
          }`}
        >
          {patching && <Loader2 className="h-3 w-3 animate-spin" />}
          {isSuspended ? "Réactiver" : "Suspendre"}
        </button>
      </motion.div>

      {/* Stat cards */}
      <motion.div
        variants={shouldReduceMotion ? reducedFadeUp : fadeUp}
        className="grid grid-cols-3 gap-3"
      >
        {[
          { label: "Membres", val: tenant.member_count, icon: Users },
          { label: "Espaces", val: tenant.space_count, icon: Layers },
          { label: "Documents", val: tenant.document_count, icon: Database },
        ].map(({ label, val, icon: Icon }) => (
          <div
            key={label}
            className="flex items-center gap-4 rounded-[20px] border border-border-subtle bg-bg-elevated-1/60 p-5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border-strong bg-bg-elevated-2">
              <Icon className="h-4 w-4 text-brand-primary" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold tabular-nums text-fg-primary">{val}</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-fg-tertiary">{label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Members section */}
      <motion.section
        variants={shouldReduceMotion ? reducedFadeUp : fadeUp}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-fg-tertiary">Membres</p>
          <button
            onClick={() => setShowAssignModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-border-subtle bg-bg-elevated-2 px-3 py-1.5 text-xs font-semibold text-fg-tertiary transition-colors hover:text-fg-primary"
          >
            <Users className="h-3.5 w-3.5" /> Ajouter
          </button>
        </div>

        <div className="rounded-[20px] border border-border-subtle bg-bg-elevated-1/60 overflow-hidden">
          {tenant.members.length === 0 ? (
            <div className="flex items-center justify-center py-10 text-sm text-fg-tertiary">
              Aucun membre.
            </div>
          ) : (
            <div className="divide-y divide-border-subtle">
              {tenant.members.map((m, i) => (
                <motion.div
                  key={m.id}
                  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-4 px-5 py-3.5"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl aurora-bg text-sm font-bold text-white">
                    {m.user_email[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-fg-primary">{m.user_email}</p>
                    <p className="text-[10px] text-fg-tertiary">{m.user_full_name || "—"}</p>
                  </div>
                  <span className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[9px] font-bold uppercase ${ROLE_BADGE[m.role] ?? ROLE_BADGE.member}`}>
                    {m.role === "owner"
                      ? <ShieldCheck className="h-2.5 w-2.5" />
                      : <Shield className="h-2.5 w-2.5" />
                    }
                    {m.role}
                  </span>
                  <span className={`rounded-lg border px-2.5 py-1 text-[9px] font-bold uppercase ${STATUS_BADGE[m.status] ?? STATUS_BADGE.active}`}>
                    {m.status}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.section>

      {/* Assign modal */}
      <AnimatePresence>
        {showAssignModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 flex items-center justify-center p-6"
          >
            <div
              className="absolute inset-0 bg-bg-base/90 backdrop-blur-sm"
              onClick={() => !assigning && setShowAssignModal(false)}
            />
            <motion.div
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.25 }}
              className="relative w-full max-w-md rounded-[28px] border border-border-strong bg-bg-elevated-1 p-8 shadow-card-lift"
            >
              <div className="absolute inset-x-0 top-0 h-0.5 aurora-bg rounded-t-[28px]" />

              <div className="mb-6 flex items-start justify-between">
                <h2 className="font-serif text-2xl text-fg-primary">Ajouter un membre</h2>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-border-subtle text-fg-tertiary transition-colors hover:text-fg-primary"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-widest text-fg-tertiary">
                    Email utilisateur
                  </label>
                  <input
                    type="email"
                    value={assignForm.user_email}
                    onChange={(e) => setAssignForm((f) => ({ ...f, user_email: e.target.value }))}
                    className="w-full rounded-2xl border border-border-subtle bg-bg-elevated-2 px-4 py-3 text-sm text-fg-primary placeholder:text-fg-tertiary focus:border-brand-primary/50 focus:outline-none transition-colors"
                    placeholder="user@example.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-widest text-fg-tertiary">Rôle</label>
                  <div className="grid grid-cols-4 gap-2">
                    {["owner", "admin", "manager", "member"].map((r) => (
                      <button
                        key={r}
                        onClick={() => setAssignForm((f) => ({ ...f, role: r }))}
                        className={`rounded-xl border py-2 text-xs font-semibold capitalize transition-colors ${
                          assignForm.role === r
                            ? "border-brand-primary/30 bg-brand-primary/15 text-brand-primary"
                            : "border-border-subtle bg-bg-elevated-2 text-fg-tertiary hover:text-fg-primary"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {assignError && (
                  <div className="rounded-2xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
                    {assignError}
                  </div>
                )}

                <button
                  onClick={handleAssign}
                  disabled={assigning || !assignForm.user_email.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl aurora-bg py-3 text-sm font-semibold text-white shadow-[0_4px_16px_-4px_rgba(99,102,241,0.5)] transition-opacity disabled:opacity-30"
                >
                  {assigning ? <Loader2 className="h-4 w-4 animate-spin" /> : "Assigner"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
