// src/app/(dashboard)/membres/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { tenantService } from "@/services/tenant.service";
import { TopBar } from "@/components/layout/TopBar";
import type { TenantMembership, TenantMember, TenantPermissions } from "@/types/tenant.types";
import {
  Users as UserGroupIcon,
  Plus as PlusIcon,
  Trash2 as TrashIcon,
  ShieldCheck as ShieldCheckIcon,
  X as XMarkIcon,
  Mail as EnvelopeIcon,
  Fingerprint as FingerPrintIcon,
  ArrowRight as ArrowRightIcon,
} from "lucide-react";

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
  const { user, isAuthenticated, isLoading, logout } = useAuth();

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
          const memberships = res.data as unknown as TenantMembership[];
          setTenants(memberships);
          setSelectedTenantId(memberships[0].tenant.id);
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
    if (!confirm("Voulez-vous vraiment retirer ce membre ?")) return;
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

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (isLoading || (!isAuthenticated && !isLoading)) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-10 h-10 border-[3px] border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-200 antialiased">
      <TopBar
        userEmail={user?.email}
        isSuperuser={user?.is_superuser}
        tenants={tenants}
        selectedTenantId={selectedTenantId}
        onTenantChange={(id) => setSelectedTenantId(id)}
        onLogout={handleLogout}
        onAdminDashboard={() => router.push("/admin/dashboard")}
      />

      <main className="max-w-7xl mx-auto px-8 md:px-12 py-16 space-y-12 relative z-10">
        {/* Hero Section */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <h2 className="text-5xl font-extrabold tracking-tight font-heading leading-tight">
               Gérez votre <br />
               <span className="text-gradient">équipe d'experts</span>
            </h2>
            <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-xl">
               Attribuez des rôles, gérez les accès et invitez de nouveaux collaborateurs dans votre base de savoir.
            </p>
          </div>
          
          {permissions?.can_manage_members && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="group flex items-center gap-3 px-8 py-4 rounded-[18px] text-white font-bold transition-all shadow-xl hover:shadow-indigo-500/20 active:scale-95 bg-gradient-brand"
            >
              <PlusIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              <span>Inviter un membre</span>
            </button>
          )}
        </section>

        {/* Members Table Stall Styling */}
        <div className="bg-[#131722] border border-white/5 rounded-[40px] overflow-hidden shadow-2xl backdrop-blur-3xl">
          {loadingMembers ? (
            <div className="py-32 flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
              <p className="text-slate-500 font-black uppercase tracking-widest text-[10px] animate-pulse">Synchronisation de l'équipe...</p>
            </div>
          ) : members.length === 0 ? (
            <div className="py-32 flex flex-col items-center justify-center space-y-8">
               <div className="w-24 h-24 rounded-[32px] bg-white/5 border border-white/10 flex items-center justify-center text-slate-600">
                  <UserGroupIcon className="w-12 h-12" />
               </div>
               <div className="text-center space-y-2">
                 <h3 className="text-2xl font-bold text-white">Équipe vide</h3>
                 <p className="text-slate-500 max-w-xs mx-auto">Invitez vos premiers collaborateurs pour commencer à travailler ensemble.</p>
               </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/[0.03] border-b border-white/5">
                    <th className="py-7 px-10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Membre</th>
                    <th className="py-7 px-10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Rôle & Permissions</th>
                    <th className="py-7 px-10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-center">Status</th>
                    <th className="py-7 px-10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {members.map((m) => (
                    <tr key={m.id} className="group hover:bg-white/[0.01] transition-all duration-300">
                      <td className="py-7 px-10">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 rounded-[20px] bg-gradient-brand flex items-center justify-center text-white font-black text-xl shadow-xl border border-white/20">
                             {(m.user?.full_name || m.user?.email || "?").charAt(0).toUpperCase()}
                          </div>
                          <div className="space-y-1">
                            <p className="font-bold text-white text-base">
                              {m.user?.full_name || "Utilisateur sans nom"}
                              {m.user?.email === user?.email && (
                                <span className="ml-3 px-2 py-0.5 rounded-md bg-indigo-500 text-[9px] font-black uppercase tracking-wider text-white">Moi</span>
                              )}
                            </p>
                            <p className="text-slate-500 text-sm font-medium">{m.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-7 px-10">
                        {permissions?.can_manage_members && m.role !== "owner" && m.user?.email !== user?.email ? (
                           <select
                             value={m.role}
                             onChange={(e) => handleRoleChange(m.id, e.target.value)}
                             className={`appearance-none bg-[#1e2330] border border-white/5 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest cursor-pointer focus:outline-none focus:border-indigo-500 transition-all ${ROLE_COLORS[m.role]}`}
                           >
                             {Object.keys(ROLE_LABELS).map(r => (
                               <option key={r} value={r} className="bg-[#131722] text-slate-300">{ROLE_LABELS[r].toUpperCase()}</option>
                             ))}
                           </select>
                        ) : (
                          <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border ${ROLE_COLORS[m.role]}`}>
                            {ROLE_LABELS[m.role] || m.role}
                          </span>
                        )}
                      </td>
                      <td className="py-7 px-10 text-center">
                         <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                           m.status === "active" 
                             ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                             : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                         }`}>
                           <span className={`w-1.5 h-1.5 rounded-full ${m.status === "active" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                           <span>{m.status === "active" ? "Actif" : "En attente"}</span>
                         </div>
                      </td>
                      <td className="py-7 px-10 text-right">
                         {m.role !== "owner" && m.user?.email !== user?.email && permissions?.can_manage_members && (
                            <button
                              onClick={() => handleRemove(m.id)}
                              disabled={removingId === m.id}
                              className="p-3 rounded-xl bg-white/5 border border-white/5 text-slate-500 hover:text-red-400 hover:border-red-400/20 hover:bg-red-400/10 transition-all shadow-sm"
                            >
                              {removingId === m.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <TrashIcon className="w-5 h-5" />}
                            </button>
                         )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[#020617]/95 backdrop-blur-xl animate-fade-in" onClick={() => !inviting && setShowInviteModal(false)} />
          
          <div className="relative w-full max-w-xl bg-[#0f172a] border border-white/10 rounded-[40px] p-12 overflow-hidden shadow-2xl animate-fade-in-up">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-brand" />
            
            <header className="flex justify-between items-start mb-10">
              <div className="space-y-2">
                <h3 className="text-3xl font-bold font-heading uppercase tracking-tight text-white">Inviter un Collaborateur</h3>
                <p className="text-slate-400 font-medium text-sm">Ajoutez un nouveau membre à votre organisation.</p>
              </div>
              <button 
                onClick={() => setShowInviteModal(false)}
                className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </header>

            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <EnvelopeIcon className="w-3 h-3" />
                  <span>Adresse e-mail</span>
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="collaborateur@entreprise.com"
                  className="w-full bg-[#131722] border border-white/5 rounded-2xl px-6 py-5 font-bold text-white focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-700"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <ShieldCheckIcon className="w-3 h-3" />
                  <span>Niveau d'accès</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                   {['admin', 'manager', 'member'].map(role => (
                     <button
                       key={role}
                       onClick={() => setInviteRole(role)}
                       className={`py-4 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                         inviteRole === role 
                         ? "bg-indigo-500/10 border-indigo-500 text-white shadow-xl" 
                         : "bg-[#131722] border-white/5 text-slate-500 hover:border-white/20"
                       }`}
                     >
                       {ROLE_LABELS[role] || role}
                     </button>
                   ))}
                </div>
              </div>

              {inviteError && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-bold flex items-center gap-3">
                  <AlertCircle className="w-5 h-5" />
                  {inviteError}
                </div>
              )}

              <button
                onClick={handleInvite}
                disabled={inviting || !inviteEmail.trim()}
                className="w-full bg-gradient-brand text-white font-black uppercase text-xs tracking-widest py-5 rounded-[20px] shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 active:scale-95 transition-all disabled:opacity-50"
              >
                {inviting ? "Envoi en cours..." : "Envoyer l'invitation"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
}

function Loader2({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
