"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { adminService } from "@/services/admin.service";
import type { AdminUser } from "@/types/admin.types";
import { Avatar } from "@/components/ui/Avatar";
import { Loader2, ShieldCheck, Search } from "lucide-react";

const PAGE_SIZE = 20;
const ACTIVE_FILTERS: { label: string; value: "" | "true" | "false" }[] = [
  { label: "Tous", value: "" },
  { label: "Actifs", value: "true" },
  { label: "Désactivés", value: "false" },
];

export default function AdminUsersPage() {
  const { user: me } = useAuth();

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
    <div className="px-8 pb-12 pt-7">
      {/* Header */}
      <div className="mb-[18px]">
        <h1 className="text-[22px] font-bold text-fg-primary">Utilisateurs</h1>
        <p className="mt-1 text-[13px] text-fg-secondary">
          {total} compte{total === 1 ? "" : "s"} sur la plateforme
        </p>
      </div>

      {/* Filters */}
      <div className="mb-3.5 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-tertiary" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Rechercher par email ou nom…"
            className="dc-input w-72 pl-8"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {ACTIVE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => {
                setFilterActive(f.value);
                setPage(1);
              }}
              className={`rounded-md border px-2.5 py-1.5 text-[12px] font-semibold transition-colors ${
                filterActive === f.value
                  ? "border-brand-primary bg-brand-soft text-brand-primary"
                  : "border-border-subtle bg-bg-elevated-2 text-fg-secondary hover:border-border-strong hover:text-fg-primary"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            setFilterSuper(filterSuper === "true" ? "" : "true");
            setPage(1);
          }}
          className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[12px] font-semibold transition-colors ${
            filterSuper === "true"
              ? "border-warning-border bg-warning-bg text-warning"
              : "border-border-subtle bg-bg-elevated-2 text-fg-secondary hover:border-border-strong hover:text-fg-primary"
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          Super Owner
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="dc-card flex items-center justify-center py-24">
          <Loader2 className="h-5 w-5 animate-spin text-brand-primary" />
        </div>
      ) : users.length === 0 ? (
        <div className="dc-card flex items-center justify-center py-20 text-[13px] text-fg-tertiary">
          Aucun utilisateur trouvé.
        </div>
      ) : (
        <div className="dc-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse">
              <thead>
                <tr>
                  <th className="dc-th text-left">Utilisateur</th>
                  <th className="dc-th text-right">Organisations</th>
                  <th className="dc-th text-left">Statut</th>
                  <th className="dc-th text-left">Rôle plateforme</th>
                  <th className="dc-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isMe = me?.id === u.id;
                  const isBusy = toggling === u.id;
                  return (
                    <tr key={u.id} className={`dc-row ${isMe ? "bg-brand-soft" : ""}`}>
                      <td className="dc-td">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={u.full_name} email={u.email} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate text-[12.5px] font-semibold text-fg-primary">
                              {u.email}
                              {isMe && (
                                <span className="ml-2 rounded-[5px] border border-transparent bg-brand-soft px-1.5 py-px text-[10px] font-bold uppercase text-brand-primary">
                                  Vous
                                </span>
                              )}
                            </p>
                            <p className="truncate text-[11.5px] text-fg-tertiary">
                              {u.full_name || "—"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="dc-td text-right font-mono text-[11.5px] tabular-nums">
                        {u.membership_count}
                      </td>

                      <td className="dc-td">
                        <span
                          className={`inline-flex rounded-[5px] border px-2 py-0.5 text-[11px] font-semibold ${
                            u.is_active
                              ? "border-success-border bg-success-bg text-success"
                              : "border-error-border bg-error-bg text-error"
                          }`}
                        >
                          {u.is_active ? "Actif" : "Désactivé"}
                        </span>
                      </td>

                      <td className="dc-td">
                        {u.is_superuser ? (
                          <span className="inline-flex items-center gap-1 rounded-[5px] border border-warning-border bg-warning-bg px-2 py-0.5 text-[11px] font-semibold text-warning">
                            <ShieldCheck className="h-2.5 w-2.5" />
                            Super Owner
                          </span>
                        ) : (
                          <span className="text-[12px] text-fg-tertiary">Standard</span>
                        )}
                      </td>

                      <td className="dc-td text-right">
                        {!isMe && (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleToggleActive(u)}
                              disabled={isBusy}
                              className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11.5px] font-semibold transition-colors disabled:opacity-50 ${
                                u.is_active
                                  ? "border-error-border bg-error-bg text-error hover:brightness-95"
                                  : "border-success-border bg-success-bg text-success hover:brightness-95"
                              }`}
                            >
                              {isBusy && <Loader2 className="h-3 w-3 animate-spin" />}
                              {u.is_active ? "Désactiver" : "Réactiver"}
                            </button>
                            <button
                              onClick={() => handleToggleSuper(u)}
                              disabled={isBusy}
                              className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11.5px] font-semibold transition-colors disabled:opacity-50 ${
                                u.is_superuser
                                  ? "border-warning-border bg-warning-bg text-warning hover:brightness-95"
                                  : "border-border-subtle bg-bg-elevated-1 text-fg-secondary hover:border-border-strong hover:text-fg-primary"
                              }`}
                            >
                              {isBusy ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <ShieldCheck className="h-3 w-3" />
                              )}
                              {u.is_superuser ? "Révoquer" : "Promouvoir"}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border-subtle px-[18px] py-3">
              <span className="text-[12px] text-fg-tertiary">
                Page {page} / {totalPages}
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="dc-btn"
                >
                  Précédent
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="dc-btn"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
