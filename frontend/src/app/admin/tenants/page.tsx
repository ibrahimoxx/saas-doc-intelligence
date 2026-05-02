"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { adminService } from "@/services/admin.service";
import type { AdminTenant } from "@/types/admin.types";
import { Shield, Plus, X, Loader2, ChevronRight, Users, Database, Layers } from "lucide-react";

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  suspended: "bg-red-500/10 border-red-500/20 text-red-400",
  trial: "bg-amber-500/10 border-amber-500/20 text-amber-400",
};
const STATUS_LABEL: Record<string, string> = { active: "Actif", suspended: "Suspendu", trial: "Essai" };

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
      setTimeout(() => { setShowModal(false); setForm({ name: "", slug: "", owner_email: "" }); setSuccessMsg(null); }, 1500);
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

  const FILTERS = [{ label: "Tous", value: "" }, { label: "Actif", value: "active" }, { label: "Suspendu", value: "suspended" }];

  return (
    <div className="space-y-12">
      <header className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <h1 className="text-4xl font-black tracking-tighter text-white">Organisations</h1>
          {!loading && <span className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-slate-400 text-[10px] font-black">{total}</span>}
        </div>
        <button onClick={() => setShowModal(true)} className="btn-magnetic flex items-center gap-3 px-6 py-3">
          <Plus className="w-4 h-4" />
          <span>Nouvelle Organisation</span>
        </button>
      </header>

      <div className="flex items-center gap-4 flex-wrap">
        <input
          type="text" value={search} onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Rechercher..."
          className="bg-white/5 border border-white/5 rounded-[20px] px-5 py-3 text-white focus:outline-none focus:border-indigo-500/50 text-sm font-medium w-64"
        />
        <div className="flex items-center gap-2">
          {FILTERS.map((f) => (
            <button key={f.value} onClick={() => setStatusFilter(f.value)}
              className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${statusFilter === f.value ? "bg-white text-indigo-950 border-white" : "bg-white/5 text-slate-500 border-white/5 hover:text-white"}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-white/5 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      ) : tenants.length === 0 ? (
        <div className="py-24 text-center text-slate-500 font-bold">Aucune organisation trouvée.</div>
      ) : (
        <div className="space-y-3">
          {tenants.map((t) => (
            <div key={t.id} className="bg-white/[0.02] border border-white/5 rounded-[32px] p-6 flex items-center gap-6 hover:border-white/10 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-lg flex-shrink-0">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <p className="text-base font-black text-white">{t.name}</p>
                  <span className={`px-3 py-0.5 rounded-full border text-[9px] font-black uppercase ${STATUS_BADGE[t.status] ?? STATUS_BADGE.active}`}>{STATUS_LABEL[t.status] ?? t.status}</span>
                </div>
                <p className="text-[10px] text-slate-500 font-bold mt-0.5">{t.slug}</p>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-black text-slate-500">
                <span className="flex items-center gap-1.5"><Users className="w-3 h-3" />{t.member_count}</span>
                <span className="flex items-center gap-1.5"><Layers className="w-3 h-3" />{t.space_count}</span>
                <span className="flex items-center gap-1.5"><Database className="w-3 h-3" />{t.document_count}</span>
              </div>
              <Link href={`/admin/tenants/${t.id}`} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:border-white/20 text-[10px] font-black uppercase tracking-widest transition-all">
                Voir <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[#020617]/95 backdrop-blur-3xl" onClick={closeModal} />
          <div className="relative w-full max-w-lg bg-white/[0.02] border border-white/10 rounded-[48px] p-12 shadow-2xl">
            <div className="flex justify-between items-start mb-10">
              <h2 className="text-3xl font-black tracking-tighter text-white">Nouvelle Organisation</h2>
              <button onClick={closeModal} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            {successMsg ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                  <Shield className="w-7 h-7 text-emerald-400" />
                </div>
                <p className="text-white font-black">Organisation créée !</p>
                <p className="text-slate-400 text-sm">{successMsg}</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Nom</label>
                  <input type="text" value={form.name} onChange={(e) => handleNameChange(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-[20px] px-5 py-3 text-white focus:outline-none focus:border-indigo-500/50 text-sm font-medium" placeholder="Acme Corp" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Slug</label>
                  <input type="text" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))} className="w-full bg-white/5 border border-white/5 rounded-[20px] px-5 py-3 text-white focus:outline-none focus:border-indigo-500/50 text-sm font-medium" placeholder="acme-corp" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Email du propriétaire</label>
                  <input type="email" value={form.owner_email} onChange={(e) => setForm((f) => ({ ...f, owner_email: e.target.value }))} className="w-full bg-white/5 border border-white/5 rounded-[20px] px-5 py-3 text-white focus:outline-none focus:border-indigo-500/50 text-sm font-medium" placeholder="owner@company.com" />
                </div>
                {createError && <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-[20px] text-red-400 text-sm font-bold">{createError}</div>}
                <button onClick={handleCreate} disabled={creating || !form.name.trim() || !form.owner_email.trim()} className="btn-magnetic w-full py-4 disabled:opacity-50">
                  {creating ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Créer l'Organisation"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
