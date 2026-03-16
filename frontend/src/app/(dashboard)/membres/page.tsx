// src/app/(dashboard)/membres/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { tenantService } from "@/services/tenant.service";
import type { TenantMembership } from "@/types/tenant.types";
import { TopBar } from "@/components/layout/TopBar";
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  MoreVertical,
  X,
  Mail,
  Loader2,
  AlertCircle,
} from "lucide-react";

const ROLE_COLORS = {
  owner: "text-amber-400 bg-amber-500/5 border-amber-500/10",
  admin: "text-indigo-400 bg-indigo-500/5 border-indigo-500/10",
  member: "text-slate-400 bg-white/5 border-white/5",
};

export default function MembresPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  const [tenants, setTenants] = useState<TenantMembership[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [members, setMembers] = useState<TenantMembership[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", role: "member" });
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      tenantService.myTenants().then((res) => {
        if (res.data?.length) {
          const data = res.data as unknown as TenantMembership[];
          setTenants(data);
          setSelectedTenantId(data[0].tenant.id);
        }
      });
    }
  }, [isAuthenticated]);

  const loadMembers = async (tid: string) => {
    setLoadingMembers(true);
    const res = await tenantService.listMembers(tid);
    if (res.data) setMembers(res.data);
    setLoadingMembers(false);
  };

  useEffect(() => {
    if (selectedTenantId) loadMembers(selectedTenantId);
  }, [selectedTenantId]);

  const handleInvite = async () => {
    if (!selectedTenantId || !inviteForm.email.trim()) return;
    setInviting(true);
    setInviteError(null);
    const res = await tenantService.inviteMember(selectedTenantId, inviteForm.email, inviteForm.role);
    if (res.error) {
      setInviteError(res.error.message);
    } else {
      setShowInviteModal(false);
      setInviteForm({ email: "", role: "member" });
      loadMembers(selectedTenantId);
    }
    setInviting(false);
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
    <div className="min-h-screen">
      <TopBar
        userEmail={user?.email}
        isSuperuser={user?.is_superuser}
        tenants={tenants}
        selectedTenantId={selectedTenantId}
        onTenantChange={setSelectedTenantId}
        onLogout={handleLogout}
        onAdminDashboard={() => router.push("/admin/dashboard")}
      />

      <main className="max-w-[1400px] mx-auto px-10 py-48 space-y-24">
        {/* Spacious Header */}
        <header className="flex flex-col lg:flex-row items-center justify-between gap-12 animate-fluid-in">
          <div className="text-center lg:text-left space-y-6 max-w-2xl">
            <h2 className="text-hero">
               Équipe & <br />
               <span className="text-gradient">Permissions</span>
            </h2>
            <p className="text-slate-400 text-lg md:text-xl font-medium leading-relaxed">
              Gérez les accès et les rôles collaboratifs au sein de votre organisation.
            </p>
          </div>

          <button
            onClick={() => setShowInviteModal(true)}
            className="btn-magnetic flex items-center gap-4 animate-fluid-in"
            style={{ animationDelay: '200ms' }}
          >
            <UserPlus className="w-5 h-5" />
            <span>Inviter un Collaborateer</span>
          </button>
        </header>

        {/* Fluid Table Overhaul */}
        <section className="animate-fluid-in" style={{ animationDelay: '400ms' }}>
           {loadingMembers ? (
              <div className="py-48 flex flex-col items-center justify-center gap-8">
                <div className="w-16 h-16 border-4 border-white/5 border-t-indigo-500 rounded-full animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600">Indexation des profils...</p>
              </div>
           ) : (
             <div className="space-y-6">
                <div className="grid grid-cols-12 px-10 text-[9px] font-black uppercase tracking-[0.4em] text-slate-600 mb-4">
                   <div className="col-span-6">Utilisateur</div>
                   <div className="col-span-3 text-center">Rôle</div>
                   <div className="col-span-2 text-center">Statut</div>
                   <div className="col-span-1 text-right">Action</div>
                </div>

                <div className="space-y-4">
                   {members.map((m, i) => (
                     <div 
                       key={m.id}
                       className="fluid-card grid grid-cols-12 items-center py-8 group"
                       style={{ animationDelay: `${(i+1)*50}ms`, padding: '1.5rem 2.5rem' }}
                     >
                        <div className="col-span-6 flex items-center gap-6">
                           <div className="w-14 h-14 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                              <span className="text-lg font-black text-white">{m.user.email[0].toUpperCase()}</span>
                           </div>
                           <div className="min-w-0">
                              <p className="text-lg font-black tracking-tight text-white line-clamp-1">
                                {m.user.full_name || m.user.email.split('@')[0]}
                              </p>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{m.user.email}</p>
                           </div>
                        </div>

                        <div className="col-span-3 flex justify-center">
                           <div className={`px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${ROLE_COLORS[m.role as keyof typeof ROLE_COLORS] || ROLE_COLORS.member}`}>
                              {m.role === 'owner' ? <ShieldCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                              <span>{m.role}</span>
                           </div>
                        </div>

                        <div className="col-span-2 flex justify-center">
                           <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase tracking-widest">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span>ACTIF</span>
                           </div>
                        </div>

                        <div className="col-span-1 flex justify-end">
                           <button className="p-3 rounded-2xl hover:bg-white/5 text-slate-500 hover:text-white transition-all">
                              <MoreVertical className="w-5 h-5" />
                           </button>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
           )}
        </section>
      </main>

      {/* Invite Modal Redesign */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[#020617]/95 backdrop-blur-3xl" onClick={() => !inviting && setShowInviteModal(false)} />
          
          <div className="relative w-full max-w-xl bg-white/[0.02] border border-white/10 rounded-[64px] p-16 shadow-2xl animate-fluid-in">
             <header className="flex justify-between items-start mb-12">
                <div className="space-y-4">
                   <h3 className="text-4xl font-black tracking-tighter text-white uppercase">Invitation</h3>
                   <p className="text-slate-400 font-medium">Ajoutez un collaborateur à l'organisation.</p>
                </div>
                <button 
                  onClick={() => setShowInviteModal(false)}
                  className="w-14 h-14 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
             </header>

             <div className="space-y-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2 flex items-center gap-2">
                    <Mail className="w-3 h-3" />
                    <span>Adresse Email</span>
                  </label>
                  <input
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    className="w-full bg-white/5 border border-white/5 rounded-[24px] px-8 py-5 text-white focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                    placeholder="partenaire@entreprise.com"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2 flex items-center gap-2">
                    <Shield className="w-3 h-3" />
                    <span>Niveau d'Accès</span>
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {["member", "admin"].map((r) => (
                      <button
                        key={r}
                        onClick={() => setInviteForm({ ...inviteForm, role: r })}
                        className={`py-4 rounded-[20px] text-[10px] font-black uppercase tracking-widest border transition-all ${
                          inviteForm.role === r 
                          ? "bg-white text-indigo-950 border-white" 
                          : "bg-white/5 text-slate-500 border-white/5 hover:bg-white/10"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {inviteError && (
                  <div className="p-5 bg-red-500/5 border border-red-500/10 rounded-[28px] text-red-400 text-sm font-bold animate-pulse">
                    {inviteError}
                  </div>
                )}

                <button
                  onClick={handleInvite}
                  disabled={inviting || !inviteForm.email.trim()}
                  className="btn-magnetic w-full py-6"
                >
                  {inviting ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : "Envoyer l'Invitation"}
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
