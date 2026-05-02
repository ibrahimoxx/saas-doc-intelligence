"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { adminService } from "@/services/admin.service";
import type { AdminUser } from "@/types/admin.types";
import { Loader2, ShieldCheck, Users } from "lucide-react";

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

  const PAGE_SIZE = 20;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const ACTIVE_FILTERS: { label: string; value: "" | "true" | "false" }[] = [
    { label: "Tous", value: "" },
    { label: "Actifs", value: "true" },
    { label: "Désactivés", value: "false" },
  ];

  return (
    <div className="space-y-10">
      <header className="flex items-center gap-4">
        <h1 className="text-4xl font-black tracking-tighter text-white">Utilisateurs</h1>
        {!loading && <span className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-slate-400 text-[10px] font-black">{total}</span>}
      </header>

      <div className="flex items-center gap-4 flex-wrap">
        <input
          type="text" value={search} onChange={(e) => handleSearch(e.target.value)}
          placeholder="Rechercher par email ou nom..."
          className="bg-white/5 border border-white/5 rounded-[20px] px-5 py-3 text-white focus:outline-none focus:border-indigo-500/50 text-sm font-medium w-72"
        />
        <div className="flex items-center gap-2">
          {ACTIVE_FILTERS.map((f) => (
            <button key={f.value} onClick={() => { setFilterActive(f.value); setPage(1); }}
              className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${filterActive === f.value ? "bg-white text-indigo-950 border-white" : "bg-white/5 text-slate-500 border-white/5 hover:text-white"}`}>
              {f.label}
            </button>
          ))}
        </div>
        <button onClick={() => { setFilterSuper(filterSuper === "true" ? "" : "true"); setPage(1); }}
          className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 ${filterSuper === "true" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-white/5 text-slate-500 border-white/5 hover:text-white"}`}>
          <ShieldCheck className="w-3 h-3" /> Super Owner
        </button>
      </div>

      {loading ? (
        <div className="py-24 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-white/5 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="py-24 text-center text-slate-500 font-bold">Aucun utilisateur trouvé.</div>
      ) : (
        <div className="space-y-2">
          {users.map((u) => {
            const isMe = me?.id === u.id;
            const isBusy = toggling === u.id;
            return (
              <div key={u.id} className="bg-white/[0.02] border border-white/5 rounded-[28px] p-5 flex items-center gap-5 hover:border-white/10 transition-all">
                <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-black text-white">{u.email[0].toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-black text-white">{u.email}</p>
                    {u.is_superuser && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-black uppercase">
                        <ShieldCheck className="w-2.5 h-2.5" /> Super Owner
                      </span>
                    )}
                    {isMe && <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-black uppercase">Vous</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <p className="text-[10px] text-slate-500">{u.full_name || "—"}</p>
                    <span className="flex items-center gap-1 text-[10px] text-slate-600"><Users className="w-2.5 h-2.5" />{u.membership_count}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <span className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase ${u.is_active ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
                    {u.is_active ? "Actif" : "Désactivé"}
                  </span>
                  {!isMe && (
                    <>
                      <button
                        onClick={() => handleToggleActive(u)}
                        disabled={isBusy}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 ${u.is_active ? "bg-red-500/5 border-red-500/10 text-red-400 hover:bg-red-500/10" : "bg-emerald-500/5 border-emerald-500/10 text-emerald-400 hover:bg-emerald-500/10"}`}
                      >
                        {isBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                        {u.is_active ? "Désactiver" : "Réactiver"}
                      </button>
                      <button
                        onClick={() => handleToggleSuper(u)}
                        disabled={isBusy}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 ${u.is_superuser ? "bg-amber-500/5 border-amber-500/10 text-amber-400 hover:bg-amber-500/10" : "bg-white/5 border-white/5 text-slate-400 hover:text-white hover:border-white/20"}`}
                      >
                        {isBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                        {u.is_superuser ? "Révoquer" : "Promouvoir"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-4">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-5 py-2.5 rounded-full bg-white/5 border border-white/5 text-slate-400 hover:text-white disabled:opacity-30 text-[10px] font-black uppercase tracking-widest transition-all">
            Précédent
          </button>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-5 py-2.5 rounded-full bg-white/5 border border-white/5 text-slate-400 hover:text-white disabled:opacity-30 text-[10px] font-black uppercase tracking-widest transition-all">
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}
