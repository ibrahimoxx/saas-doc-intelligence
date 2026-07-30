"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { adminService } from "@/services/admin.service";
import type { AdminTenant } from "@/types/admin.types";
import { Modal } from "@/components/ui/Modal";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import {
  Shield,
  Plus,
  Loader2,
  ChevronRight,
  Search,
} from "lucide-react";

const STATUS_BADGE: Record<string, string> = {
  active: "border-success-border bg-success-bg text-success",
  suspended: "border-error-border bg-error-bg text-error",
  trial: "border-warning-border bg-warning-bg text-warning",
};
const STATUS_LABEL: Record<string, string> = { active: "Actif", suspended: "Suspendu", trial: "Essai" };

const FILTERS = [
  { label: "Tous", value: "" },
  { label: "Actif", value: "active" },
  { label: "Suspendu", value: "suspended" },
];

export default function AdminTenantsPage() {
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
    <div className="px-8 pb-12 pt-7">
      {/* Header */}
      <div className="mb-[18px] flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="text-[22px] font-bold text-fg-primary">Organisations</h1>
          <p className="mt-1 text-[13px] text-fg-secondary">
            {total} organisation{total === 1 ? "" : "s"} sur la plateforme
          </p>
        </div>
        <button type="button" onClick={() => setShowModal(true)} className="dc-btn-primary">
          <Plus className="h-3.5 w-3.5" />
          Nouvelle organisation
        </button>
      </div>

      {/* Filters */}
      <div className="mb-3.5 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-tertiary" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Rechercher…"
            className="dc-input w-56 pl-8"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`rounded-md border px-2.5 py-1.5 text-[12px] font-semibold transition-colors ${
                statusFilter === f.value
                  ? "border-brand-primary bg-brand-soft text-brand-primary"
                  : "border-border-subtle bg-bg-elevated-2 text-fg-secondary hover:border-border-strong hover:text-fg-primary"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="dc-card flex items-center justify-center py-24">
          <Loader2 className="h-5 w-5 animate-spin text-brand-primary" />
        </div>
      ) : tenants.length === 0 ? (
        <div className="dc-card flex items-center justify-center py-20 text-[13px] text-fg-tertiary">
          Aucune organisation trouvée.
        </div>
      ) : (
        <div className="dc-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse">
              <thead>
                <tr>
                  <th className="dc-th text-left">Tenant</th>
                  <th className="dc-th text-left">Slug</th>
                  <th className="dc-th text-right">Membres</th>
                  <th className="dc-th text-right">Espaces</th>
                  <th className="dc-th text-right">Documents</th>
                  <th className="dc-th text-left">Statut</th>
                  <th className="dc-th w-20 text-right" />
                </tr>
              </thead>
              <tbody>
                {tenants.map((t) => (
                  <tr key={t.id} className="dc-row">
                    <td className="dc-td font-semibold text-fg-primary">
                      <div className="flex items-center gap-2">
                        <Shield className="h-3.5 w-3.5 shrink-0 text-fg-tertiary" />
                        <span className="truncate">{t.name}</span>
                      </div>
                    </td>
                    <td className="dc-td font-mono text-[11.5px]">{t.slug}</td>
                    <td className="dc-td text-right font-mono text-[11.5px] tabular-nums">
                      {t.member_count}
                    </td>
                    <td className="dc-td text-right font-mono text-[11.5px] tabular-nums">
                      {t.space_count}
                    </td>
                    <td className="dc-td text-right font-mono text-[11.5px] tabular-nums">
                      {t.document_count}
                    </td>
                    <td className="dc-td">
                      <span
                        className={`inline-flex rounded-[5px] border px-2 py-0.5 text-[11px] font-semibold ${
                          STATUS_BADGE[t.status] ?? STATUS_BADGE.active
                        }`}
                      >
                        {STATUS_LABEL[t.status] ?? t.status}
                      </span>
                    </td>
                    <td className="dc-td text-right">
                      <Link
                        href={`/admin/tenants/${t.id}`}
                        className="inline-flex items-center gap-1 text-[12px] font-semibold text-fg-tertiary transition-colors hover:text-brand-primary"
                      >
                        Voir
                        <ChevronRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create modal */}
      <Modal isOpen={showModal} onClose={closeModal} width="max-w-lg">
        {successMsg ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-success-border bg-success-bg">
              <Shield className="h-5 w-5 text-success" />
            </div>
            <p className="text-[15px] font-bold text-fg-primary">Organisation créée</p>
            <p className="text-[13px] text-fg-secondary">{successMsg}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-[17px] font-bold text-fg-primary">Nouvelle organisation</h2>

            <div className="space-y-1.5">
              <label className="dc-label" htmlFor="tenant-name">
                Nom
              </label>
              <input
                id="tenant-name"
                type="text"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="dc-input"
                placeholder="Acme Corp"
              />
            </div>

            <div className="space-y-1.5">
              <label className="dc-label" htmlFor="tenant-slug">
                Slug
              </label>
              <input
                id="tenant-slug"
                type="text"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
                className="dc-input font-mono"
                placeholder="acme-corp"
              />
            </div>

            <div className="space-y-1.5">
              <label className="dc-label" htmlFor="tenant-owner">
                Email du propriétaire
              </label>
              <input
                id="tenant-owner"
                type="email"
                value={form.owner_email}
                onChange={(e) => setForm((f) => ({ ...f, owner_email: e.target.value }))}
                className="dc-input"
                placeholder="owner@company.com"
              />
            </div>

            {createError && <ErrorBanner message={createError} dismissible={false} />}

            <div className="flex justify-end gap-2">
              <button type="button" onClick={closeModal} disabled={creating} className="dc-btn">
                Annuler
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !form.name.trim() || !form.owner_email.trim()}
                className="dc-btn-primary"
              >
                {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Créer l'organisation"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
