"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminService } from "@/services/admin.service";
import type { AdminTenantDetail } from "@/types/admin.types";
import { ChevronLeft, Users, Layers, Database, Loader2, X, ShieldCheck, Shield } from "lucide-react";

const ROLE_BADGE: Record<string, string> = {
  owner: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  admin: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
  manager: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
  member: "bg-white/5 border-white/10 text-slate-400",
};
const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  disabled: "bg-red-500/10 border-red-500/20 text-red-400",
  invited: "bg-amber-500/10 border-amber-500/20 text-amber-400",
};

export default function AdminTenantDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
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

  if (loading) return (
    <div className="py-24 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-white/5 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  );

  if (!tenant) return (
    <div className="py-24 text-center text-slate-500 font-bold">Organisation introuvable.</div>
  );

  const tenantStatusBadge = tenant.status === "active"
    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
    : "bg-red-500/10 border-red-500/20 text-red-400";

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-4">
        <Link href="/admin/tenants" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-bold transition-colors">
          <ChevronLeft className="w-4 h-4" /> Organisations
        </Link>
      </div>

      <header className="flex items-center justify-between gap-6 flex-wrap">
        <div className="flex items-center gap-4">
          <h1 className="text-4xl font-black tracking-tighter text-white">{tenant.name}</h1>
          <span className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase ${tenantStatusBadge}`}>
            {tenant.status === "active" ? "Actif" : "Suspendu"}
          </span>
        </div>
        <button
          onClick={handleStatusToggle}
          disabled={patching}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 ${tenant.status === "suspended" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20" : "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"}`}
        >
          {patching ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
          {tenant.status === "suspended" ? "Réactiver" : "Suspendre"}
        </button>
      </header>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Membres", val: tenant.member_count, icon: Users },
          { label: "Espaces", val: tenant.space_count, icon: Layers },
          { label: "Documents", val: tenant.document_count, icon: Database },
        ].map(({ label, val, icon: Icon }) => (
          <div key={label} className="bg-white/[0.02] border border-white/10 rounded-[32px] p-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <Icon className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-2xl font-black text-white">{val}</p>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Membres</h2>
          <button onClick={() => setShowAssignModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:border-white/20 text-[10px] font-black uppercase tracking-widest transition-all">
            <Users className="w-3 h-3" /> Ajouter
          </button>
        </div>
        <div className="space-y-2">
          {tenant.members.map((m) => (
            <div key={m.id} className="bg-white/[0.02] border border-white/5 rounded-[24px] p-4 flex items-center gap-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-black text-white">{m.user_email[0].toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-white truncate">{m.user_email}</p>
                <p className="text-[10px] text-slate-500">{m.user_full_name || "—"}</p>
              </div>
              <span className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase ${ROLE_BADGE[m.role] ?? ROLE_BADGE.member}`}>
                {m.role === "owner" ? <ShieldCheck className="w-3 h-3 inline mr-1" /> : <Shield className="w-3 h-3 inline mr-1" />}
                {m.role}
              </span>
              <span className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase ${STATUS_BADGE[m.status] ?? STATUS_BADGE.active}`}>
                {m.status}
              </span>
            </div>
          ))}
          {tenant.members.length === 0 && <p className="text-slate-500 text-sm py-4 text-center">Aucun membre.</p>}
        </div>
      </section>

      {showAssignModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[#020617]/95 backdrop-blur-3xl" onClick={() => !assigning && setShowAssignModal(false)} />
          <div className="relative w-full max-w-md bg-white/[0.02] border border-white/10 rounded-[48px] p-12 shadow-2xl">
            <div className="flex justify-between items-start mb-8">
              <h2 className="text-2xl font-black tracking-tighter text-white">Ajouter un membre</h2>
              <button onClick={() => setShowAssignModal(false)} className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Email utilisateur</label>
                <input type="email" value={assignForm.user_email} onChange={(e) => setAssignForm((f) => ({ ...f, user_email: e.target.value }))} className="w-full bg-white/5 border border-white/5 rounded-[20px] px-5 py-3 text-white focus:outline-none focus:border-indigo-500/50 text-sm font-medium" placeholder="user@example.com" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Rôle</label>
                <div className="grid grid-cols-4 gap-2">
                  {["owner", "admin", "manager", "member"].map((r) => (
                    <button key={r} onClick={() => setAssignForm((f) => ({ ...f, role: r }))}
                      className={`py-2.5 rounded-[16px] text-[9px] font-black uppercase tracking-widest border transition-all ${assignForm.role === r ? "bg-white text-indigo-950 border-white" : "bg-white/5 text-slate-500 border-white/5 hover:bg-white/10"}`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              {assignError && <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-[20px] text-red-400 text-sm font-bold">{assignError}</div>}
              <button onClick={handleAssign} disabled={assigning || !assignForm.user_email.trim()} className="btn-magnetic w-full py-4 disabled:opacity-50">
                {assigning ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Assigner"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
