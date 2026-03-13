"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { tenantService } from "@/services/tenant.service";
import type { TenantMembership, TenantMember, TenantPermissions } from "@/types/tenant.types";
import {
  UserGroupIcon,
  PlusIcon,
  TrashIcon,
  ShieldCheckIcon,
  XMarkIcon,
  EnvelopeIcon,
  IdentificationIcon,
  FingerPrintIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  admin: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  manager: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  member: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

const ROLE_LABELS: Record<string, string> = {
  owner: "Propriétaire",
  admin: "Administrateur",
  manager: "Gestionnaire",
  member: "Membre",
};

export default function MembresPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  const [tenants, setTenants] = useState<TenantMembership[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [members, setMembers] = useState<TenantMember[]>([]);
  const [permissions, setPermissions] = useState<TenantPermissions | null>(null);

  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      tenantService.myTenants().then((res) => {
        if (res.data?.length) {
          setTenants(res.data as unknown as TenantMembership[]);
          setSelectedTenantId((res.data[0] as unknown as TenantMembership).tenant.id);
        }
      });
    }
  }, [isAuthenticated]);

  const loadData = useCallback(async (tenantId: string) => {
    setLoadingMembers(true);
    const [membersRes, permsRes] = await Promise.all([
      tenantService.members(tenantId),
      tenantService.myPermissions(tenantId),
    ]);
    if (membersRes.data) setMembers(membersRes.data as unknown as TenantMember[]);
    if (permsRes.data) setPermissions(permsRes.data);
    setLoadingMembers(false);
  }, []);

  useEffect(() => {
    if (selectedTenantId) loadData(selectedTenantId);
  }, [selectedTenantId, loadData]);

  const handleInvite = async () => {
    if (!selectedTenantId || !inviteEmail.trim()) return;
    setInviting(true);
    setInviteError(null);
    const res = await tenantService.inviteMember(selectedTenantId, inviteEmail.trim(), inviteRole);
    if (res.error) {
      setInviteError(res.error.message);
    } else {
      setShowInviteModal(false);
      setInviteEmail("");
      setInviteRole("member");
      loadData(selectedTenantId);
    }
    setInviting(false);
  };

  const handleRemove = async (memberId: string) => {
    if (!selectedTenantId) return;
    setRemovingId(memberId);
    const res = await tenantService.removeMember(selectedTenantId, memberId);
    if (res.error) {
      alert(res.error.message);
    } else {
      loadData(selectedTenantId);
    }
    setRemovingId(null);
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    if (!selectedTenantId) return;
    const res = await tenantService.updateMemberRole(selectedTenantId, memberId, newRole);
    if (res.error) {
      alert(res.error.message);
    } else {
      loadData(selectedTenantId);
    }
  };

  const currentTenant = tenants.find((m) => m.tenant.id === selectedTenantId);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <div className="absolute inset-0 blur-xl bg-indigo-500/20 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-indigo-500/30">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-purple-500/5 rounded-full blur-[100px] animate-pulse" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#020617]/70 backdrop-blur-2xl border-b border-white/[0.05] px-8 py-5">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <button 
              onClick={() => router.push("/dashboard")} 
              className="group flex items-center space-x-2 text-slate-500 hover:text-white transition-all"
            >
              <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-indigo-500/50 group-hover:bg-indigo-500/10 transition-all">
                <span className="text-xs group-hover:-translate-x-0.5 transition-transform">←</span>
              </div>
              <span className="text-sm font-medium tracking-tight">Tableau de bord</span>
            </button>
            <div className="h-6 w-px bg-white/10" />
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-inner">
                <UserGroupIcon className="w-5 h-5 text-indigo-400" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white">Gestion de l'équipe</h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {tenants.length > 1 && (
              <div className="relative">
                <select
                  value={selectedTenantId || ""}
                  onChange={(e) => setSelectedTenantId(e.target.value)}
                  className="appearance-none bg-white/[0.03] border border-white/[0.08] hover:border-indigo-500/30 rounded-2xl pl-10 pr-10 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
                >
                  {tenants.map((m) => (
                    <option key={m.tenant.id} value={m.tenant.id} className="bg-[#0f172a]">
                      {m.tenant.name}
                    </option>
                  ))}
                </select>
                <IdentificationIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>
            )}
            {permissions?.can_manage_members && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:-translate-y-0.5 active:translate-y-0"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Inviter un membre</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-[1400px] mx-auto px-8 py-12">
        <div className="space-y-10">
          {/* Hero Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <h2 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl">
                Équipe <span className="text-gradient leading-relaxed">{currentTenant?.tenant.name}</span>
              </h2>
              <p className="text-slate-400 text-lg font-medium">
                Gérez les permissions et collaborez avec votre équipe au sein de l'organisation.
              </p>
            </div>
            <div className="flex flex-col items-end">
               <div className="px-5 py-2 rounded-2xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-md">
                 <span className="text-2xl font-bold text-white leading-none">{members.length}</span>
                 <span className="text-slate-500 text-sm font-medium ml-2 uppercase tracking-widest">Membres Actifs</span>
               </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="glass-card rounded-[2.5rem] overflow-hidden">
            {loadingMembers ? (
              <div className="flex items-center justify-center py-32">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-10 h-10 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                  <span className="text-slate-500 text-sm font-medium animate-pulse">Chargement des membres...</span>
                </div>
              </div>
            ) : members.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-6">
                <div className="w-20 h-20 rounded-3xl bg-slate-800/20 border border-white/5 flex items-center justify-center animate-glow">
                  <UserGroupIcon className="w-10 h-10 text-slate-700" />
                </div>
                <div className="text-center space-y-2">
                   <h3 className="text-xl font-bold text-white">Aucun membre trouvé</h3>
                   <p className="text-slate-500 max-w-xs mx-auto">Commencez par inviter vos collaborateurs à rejoindre cette organisation.</p>
                </div>
                {permissions?.can_manage_members && (
                    <button onClick={() => setShowInviteModal(true)} className="text-indigo-400 font-bold flex items-center space-x-2 hover:text-indigo-300 transition-colors underline-offset-4 hover:underline">
                        <span>Inviter maintenant</span>
                        <ArrowRightIcon className="w-4 h-4" />
                    </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/[0.05]">
                  <thead className="bg-white/[0.02]">
                    <tr>
                      <th className="px-10 py-6 text-left text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em]">Membre</th>
                      <th className="px-10 py-6 text-left text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em]">Rôle & Permissions</th>
                      <th className="px-10 py-6 text-left text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em]">Disponibilité</th>
                      <th className="px-10 py-6 text-left text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em]">Date de rejoint</th>
                      {permissions?.can_manage_members && (
                        <th className="px-10 py-6 text-right text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em]">Gestion</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {members.map((m) => (
                      <tr key={m.id} className="group hover:bg-white/[0.015] transition-all duration-300">
                        <td className="px-10 py-7">
                          <div className="flex items-center space-x-5">
                            <div className="relative">
                               <div className="pointer-events-none absolute -inset-1 blur-lg bg-indigo-500/20 group-hover:bg-indigo-500/40 transition-all opacity-0 group-hover:opacity-100" />
                               <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-xl shadow-indigo-500/10 border border-white/20">
                                  {(m.user?.full_name || m.user?.email || "?").charAt(0).toUpperCase()}
                               </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <p className="font-bold text-white text-base leading-none">
                                  {m.user?.full_name || "Utilisateur sans nom"}
                                </p>
                                {m.user?.email === user?.email && (
                                  <span className="px-2 py-0.5 rounded-lg bg-indigo-500 text-[10px] font-black uppercase tracking-wider text-white shadow-lg shadow-indigo-500/30">Moi</span>
                                )}
                              </div>
                              <p className="text-slate-500 font-medium text-sm flex items-center space-x-1.5">
                                <EnvelopeIcon className="w-3.5 h-3.5" />
                                <span>{m.user?.email}</span>
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-7">
                          {permissions?.can_manage_members && m.role !== "owner" ? (
                            <div className="relative inline-flex items-center group/select">
                                <select
                                  value={m.role}
                                  onChange={(e) => handleRoleChange(m.id, e.target.value)}
                                  className={`appearance-none text-xs font-black uppercase tracking-widest border rounded-xl pl-4 pr-10 py-2.5 bg-white/[0.03] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer transition-all ${ROLE_COLORS[m.role]}`}
                                >
                                  {Object.keys(ROLE_LABELS).filter(r => r !== "owner").map(r => (
                                      <option key={r} value={r} className="bg-[#0f172a] text-white uppercase">{ROLE_LABELS[r]}</option>
                                  ))}
                                </select>
                                <div className="absolute right-4 w-4 h-4 flex items-center justify-center pointer-events-none opacity-50 group-hover/select:opacity-100 transition-opacity">
                                    <ChevronSmallDownIcon className="w-3 h-3" />
                                </div>
                            </div>
                          ) : (
                            <span className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border shadow-sm ${ROLE_COLORS[m.role]}`}>
                              {m.role === "owner" && <ShieldCheckIcon className="w-4 h-4 animate-pulse" />}
                              <span>{ROLE_LABELS[m.role] || m.role}</span>
                            </span>
                          )}
                        </td>
                        <td className="px-10 py-7">
                          <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${
                            m.status === "active" 
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}>
                            <span className={`relative flex h-2 w-2`}>
                               {m.status === "active" && (
                                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                               )}
                               <span className={`relative inline-flex rounded-full h-2 w-2 ${m.status === "active" ? "bg-emerald-500" : "bg-amber-500"}`}></span>
                            </span>
                            <span>{m.status === "active" ? "Opérationnel" : "En attente"}</span>
                          </div>
                        </td>
                        <td className="px-10 py-7">
                           <div className="flex flex-col">
                             <span className="text-sm font-semibold text-white">
                               {new Date(m.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                             </span>
                             <span className="text-xs text-slate-600 font-medium">En {new Date(m.created_at).getFullYear()}</span>
                           </div>
                        </td>
                        {permissions?.can_manage_members && (
                          <td className="px-10 py-7 text-right">
                            {m.role !== "owner" && m.user?.email !== user?.email && (
                              <button
                                onClick={() => handleRemove(m.id)}
                                disabled={removingId === m.id}
                                className="group/del p-3 rounded-2xl bg-white/[0.03] border border-white/[0.05] text-slate-500 hover:text-red-400 hover:bg-red-400/10 hover:border-red-400/20 transition-all shadow-sm"
                                title="Retirer de l'équipe"
                              >
                                {removingId === m.id ? (
                                  <div className="w-5 h-5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                                ) : (
                                  <TrashIcon className="w-5 h-5 group-hover/del:scale-110 active:scale-95 transition-transform" />
                                )}
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {/* Footer shadow fade */}
            <div className="h-4 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
          </div>
        </div>
      </main>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 overflow-hidden">
          <div className="absolute inset-0 bg-[#020617]/80 backdrop-blur-md animate-fade-in" onClick={() => !inviting && setShowInviteModal(false)} />
          
          <div className="relative w-full max-w-xl animate-zoom-in">
             {/* Gradient glow behind modal */}
            <div className="absolute -inset-1 blur-2xl bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 opacity-100" />
            
            <div className="relative bg-[#0f172a] border border-white/[0.08] rounded-[2.5rem] p-10 shadow-2xl overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                
                <div className="flex items-center justify-between mb-8">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-white tracking-tight">Nouvelle Invitation</h3>
                    <p className="text-slate-400 text-sm font-medium">Ajoutez un collaborateur à votre organisation.</p>
                  </div>
                  <button 
                    onClick={() => { setShowInviteModal(false); setInviteError(null); }} 
                    disabled={inviting}
                    className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Adresse e-mail professionnelle</label>
                    <div className="relative group/input">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <EnvelopeIcon className="w-5 h-5 text-slate-600 group-focus-within/input:text-indigo-400 transition-colors" />
                        </div>
                        <input
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="jean.dupont@entreprise.com"
                          className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-indigo-500/50 rounded-2xl pl-12 pr-6 py-4 text-white text-base placeholder-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                          onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                        />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Rôle & Permissions</label>
                    <div className="grid grid-cols-1 gap-3">
                        {Object.entries(ROLE_LABELS).filter(([k]) => k !== "owner").map(([role, label]) => (
                            <button
                                key={role}
                                onClick={() => setInviteRole(role)}
                                className={`flex items-center justify-between p-5 rounded-3xl border transition-all ${
                                    inviteRole === role 
                                    ? "bg-indigo-500/10 border-indigo-500 shadow-lg shadow-indigo-500/10" 
                                    : "bg-white/[0.02] border-white/[0.05] hover:border-white/10 text-slate-500"
                                }`}
                            >
                                <div className="flex items-center space-x-4 text-left">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                                        inviteRole === role ? "bg-indigo-500/20 border-indigo-500/30" : "bg-white/5 border-white/10"
                                    }`}>
                                        {role === "admin" ? <ShieldCheckIcon className="w-5 h-5" /> : role === "manager" ? <FingerPrintIcon className="w-5 h-5" /> : <UserGroupIcon className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <p className={`font-bold text-sm ${inviteRole === role ? "text-white" : "text-slate-300"}`}>{label}</p>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">
                                            {role === "admin" ? "Contrôle total" : role === "manager" ? "Peut uploader" : "Accès lecture"}
                                        </p>
                                    </div>
                                </div>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                    inviteRole === role ? "border-indigo-500 bg-indigo-500" : "border-white/20"
                                }`}>
                                    {inviteRole === role && <div className="w-2.5 h-2.5 bg-white rounded-full shadow-inner animate-zoom-in" />}
                                </div>
                            </button>
                        ))}
                    </div>
                  </div>

                  {inviteError && (
                    <div className="flex items-start space-x-3 bg-red-500/10 border border-red-500/30 rounded-2xl px-5 py-4 text-red-400 text-sm animate-shake">
                      <XMarkIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <p className="font-semibold">{inviteError}</p>
                    </div>
                  )}

                  <div className="pt-4">
                    <button
                      onClick={handleInvite}
                      disabled={inviting || !inviteEmail.trim()}
                      className="w-full relative group/btn overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 transition-all group-hover:scale-105 active:scale-95" />
                      <div className="relative flex items-center justify-center space-x-2 py-5 font-black text-white uppercase tracking-[0.2em] text-sm">
                        {inviting ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <span>Envoyer l'invitation</span>
                                <PlusIcon className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                            </>
                        )}
                      </div>
                    </button>
                  </div>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Icons small utility */}
      <style jsx>{`
        .text-gradient {
          background: linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #f472b6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes zoom-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); } 20%, 40%, 60%, 80% { transform: translateX(4px); } }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        .animate-zoom-in { animation: zoom-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .animate-shake { animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both; }
      `}</style>
    </div>
  );
}

function ChevronSmallDownIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
    )
}
