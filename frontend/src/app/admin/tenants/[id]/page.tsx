"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { adminService } from "@/services/admin.service";
import type { AdminTenantDetail } from "@/types/admin.types";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import {
  ChevronLeft,
  Users,
  Layers,
  Database,
  Loader2,
  ShieldCheck,
  Shield,
} from "lucide-react";

const ROLE_BADGE: Record<string, string> = {
  owner: "border-warning-border bg-warning-bg text-warning",
  admin: "border-transparent bg-brand-soft text-brand-primary",
  manager: "border-info-border bg-info-bg text-info",
  member: "border-border-subtle bg-bg-elevated-1 text-fg-secondary",
};
const STATUS_BADGE: Record<string, string> = {
  active: "border-success-border bg-success-bg text-success",
  disabled: "border-error-border bg-error-bg text-error",
  invited: "border-warning-border bg-warning-bg text-warning",
};

export default function AdminTenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

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
      <div className="flex flex-1 items-center justify-center py-24">
        <Loader2 className="h-5 w-5 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="flex flex-1 items-center justify-center py-24 text-[13px] text-fg-tertiary">
        Organisation introuvable.
      </div>
    );
  }

  const isSuspended = tenant.status === "suspended";

  return (
    <div className="px-8 pb-12 pt-7">
      {/* Breadcrumb */}
      <Link
        href="/admin/tenants"
        className="mb-2 flex w-fit items-center gap-1.5 text-[12px] font-semibold text-fg-tertiary transition-colors hover:text-fg-primary"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Organisations
      </Link>

      {/* Header */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[22px] font-bold text-fg-primary">{tenant.name}</h1>
            <span
              className={`inline-flex rounded-[5px] border px-2 py-0.5 text-[11px] font-semibold ${
                isSuspended
                  ? "border-error-border bg-error-bg text-error"
                  : "border-success-border bg-success-bg text-success"
              }`}
            >
              {isSuspended ? "Suspendu" : "Actif"}
            </span>
          </div>
          <p className="mt-1 font-mono text-[12px] text-fg-tertiary">{tenant.slug}</p>
        </div>

        <button
          onClick={handleStatusToggle}
          disabled={patching}
          className={`inline-flex items-center gap-1.5 rounded-md border px-3.5 py-2 text-[12.5px] font-semibold transition-colors disabled:opacity-50 ${
            isSuspended
              ? "border-success-border bg-success-bg text-success hover:brightness-95"
              : "border-error-border bg-error-bg text-error hover:brightness-95"
          }`}
        >
          {patching && <Loader2 className="h-3 w-3 animate-spin" />}
          {isSuspended ? "Réactiver" : "Suspendre"}
        </button>
      </div>

      {/* Stat cards */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        {[
          { label: "Membres", val: tenant.member_count, icon: Users },
          { label: "Espaces", val: tenant.space_count, icon: Layers },
          { label: "Documents", val: tenant.document_count, icon: Database },
        ].map(({ label, val, icon: Icon }) => (
          <div key={label} className="dc-card px-4 py-3.5">
            <div className="flex items-start justify-between gap-2">
              <span className="dc-label">{label}</span>
              <Icon className="h-4 w-4 shrink-0 text-fg-tertiary" />
            </div>
            <div className="mt-2 text-[21px] font-bold tabular-nums text-fg-primary">{val}</div>
          </div>
        ))}
      </div>

      {/* Members */}
      <div className="dc-card overflow-hidden">
        <div className="dc-panel-header">
          <span>Membres</span>
          <button
            type="button"
            onClick={() => setShowAssignModal(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border-subtle bg-bg-elevated-1 px-2.5 py-1 text-[11.5px] font-semibold text-fg-secondary transition-colors hover:border-border-strong hover:text-fg-primary"
          >
            <Users className="h-3 w-3" />
            Ajouter
          </button>
        </div>

        {tenant.members.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-[13px] text-fg-tertiary">
            Aucun membre.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse">
              <thead>
                <tr>
                  <th className="dc-th text-left">Membre</th>
                  <th className="dc-th text-left">Rôle</th>
                  <th className="dc-th text-left">Statut</th>
                </tr>
              </thead>
              <tbody>
                {tenant.members.map((m) => (
                  <tr key={m.id} className="dc-row">
                    <td className="dc-td">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={m.user_full_name} email={m.user_email} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-[12.5px] font-semibold text-fg-primary">
                            {m.user_email}
                          </p>
                          <p className="truncate text-[11.5px] text-fg-tertiary">
                            {m.user_full_name || "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="dc-td">
                      <span
                        className={`inline-flex items-center gap-1 rounded-[5px] border px-2 py-0.5 text-[11px] font-semibold capitalize ${
                          ROLE_BADGE[m.role] ?? ROLE_BADGE.member
                        }`}
                      >
                        {m.role === "owner" ? (
                          <ShieldCheck className="h-2.5 w-2.5" />
                        ) : (
                          <Shield className="h-2.5 w-2.5" />
                        )}
                        {m.role}
                      </span>
                    </td>
                    <td className="dc-td">
                      <span
                        className={`inline-flex rounded-[5px] border px-2 py-0.5 text-[11px] font-semibold capitalize ${
                          STATUS_BADGE[m.status] ?? STATUS_BADGE.active
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => !assigning && setShowAssignModal(false)}
        width="max-w-md"
      >
        <div className="space-y-4">
          <h2 className="text-[17px] font-bold text-fg-primary">Ajouter un membre</h2>

          <div className="space-y-1.5">
            <label className="dc-label" htmlFor="assign-email">
              Email utilisateur
            </label>
            <input
              id="assign-email"
              type="email"
              value={assignForm.user_email}
              onChange={(e) => setAssignForm((f) => ({ ...f, user_email: e.target.value }))}
              className="dc-input"
              placeholder="user@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <p className="dc-label">Rôle</p>
            <div className="grid grid-cols-4 gap-2">
              {["owner", "admin", "manager", "member"].map((r) => (
                <button
                  key={r}
                  onClick={() => setAssignForm((f) => ({ ...f, role: r }))}
                  className={`rounded-md border py-2 text-[12px] font-semibold capitalize transition-colors ${
                    assignForm.role === r
                      ? "border-brand-primary bg-brand-soft text-brand-primary"
                      : "border-border-subtle bg-bg-base text-fg-secondary hover:border-border-strong hover:text-fg-primary"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {assignError && <ErrorBanner message={assignError} dismissible={false} />}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAssignModal(false)}
              disabled={assigning}
              className="dc-btn"
            >
              Annuler
            </button>
            <button
              onClick={handleAssign}
              disabled={assigning || !assignForm.user_email.trim()}
              className="dc-btn-primary"
            >
              {assigning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Assigner"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
