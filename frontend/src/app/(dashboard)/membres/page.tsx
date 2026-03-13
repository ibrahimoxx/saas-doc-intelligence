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
  ChevronUpDownIcon,
  ShieldCheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  admin: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  manager: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  member: "bg-slate-500/15 text-slate-400 border-slate-500/30",
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
    if (!confirm("Retirer ce membre de l'organisation ?")) return;
    setRemovingId(memberId);
    await tenantService.removeMember(selectedTenantId, memberId);
    setRemovingId(null);
    loadData(selectedTenantId);
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    if (!selectedTenantId) return;
    await tenantService.updateMemberRole(selectedTenantId, memberId, newRole);
    loadData(selectedTenantId);
  };

  const currentTenant = tenants.find((m) => m.tenant.id === selectedTenantId);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#020617]/90 backdrop-blur-xl border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={() => router.push("/dashboard")} className="text-slate-400 hover:text-white transition-colors text-sm flex items-center space-x-2">
            <span>←</span><span>Dashboard</span>
          </button>
          <div className="h-4 w-px bg-slate-700" />
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <UserGroupIcon className="w-4 h-4 text-indigo-400" />
            </div>
            <h1 className="font-bold text-white">Membres</h1>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {tenants.length > 1 && (
            <select
              value={selectedTenantId || ""}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              className="bg-slate-800/50 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              {tenants.map((m) => (
                <option key={m.tenant.id} value={m.tenant.id}>{m.tenant.name}</option>
              ))}
            </select>
          )}
          {permissions?.can_manage_members && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-indigo-500/20"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Inviter</span>
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        {/* Page Title */}
        <div>
          <h2 className="text-3xl font-extrabold text-white">
            Équipe <span className="text-gradient">{currentTenant?.tenant.name}</span>
          </h2>
          <p className="text-slate-400 mt-1 text-sm">
            {members.length} membre{members.length !== 1 ? "s" : ""} dans cette organisation
          </p>
        </div>

        {/* Members Table */}
        <div className="glass-card rounded-3xl overflow-hidden">
          {loadingMembers ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            </div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <div className="p-4 rounded-2xl bg-slate-800/50">
                <UserGroupIcon className="w-10 h-10 text-slate-600" />
              </div>
              <p className="text-slate-500 font-medium">Aucun membre trouvé.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-white/5">
              <thead className="bg-white/[0.02]">
                <tr>
                  <th className="px-8 py-5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Membre</th>
                  <th className="px-8 py-5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Rôle</th>
                  <th className="px-8 py-5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Statut</th>
                  <th className="px-8 py-5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ajouté le</th>
                  {permissions?.can_manage_members && (
                    <th className="px-8 py-5 text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {members.map((m) => (
                  <tr key={m.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold text-sm">
                          {(m.user?.full_name || m.user?.email || "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-white text-sm">{m.user?.full_name || "—"}</p>
                          <p className="text-slate-400 text-xs">{m.user?.email}</p>
                        </div>
                        {m.user?.email === user?.email && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-md border border-indigo-500/20">Vous</span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      {permissions?.can_manage_members && m.role !== "owner" ? (
                        <select
                          value={m.role}
                          onChange={(e) => handleRoleChange(m.id, e.target.value)}
                          className={`text-xs font-bold border rounded-lg px-2.5 py-1.5 bg-transparent focus:outline-none cursor-pointer ${ROLE_COLORS[m.role]}`}
                        >
                          <option value="admin">Administrateur</option>
                          <option value="manager">Gestionnaire</option>
                          <option value="member">Membre</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${ROLE_COLORS[m.role]}`}>
                          {m.role === "owner" && <ShieldCheckIcon className="w-3 h-3" />}
                          <span>{ROLE_LABELS[m.role] || m.role}</span>
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                        m.status === "active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${m.status === "active" ? "bg-emerald-400" : "bg-amber-400"}`} />
                        <span>{m.status === "active" ? "Actif" : "Invité"}</span>
                      </span>
                    </td>
                    <td className="px-8 py-5 text-sm text-slate-400">
                      {new Date(m.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    {permissions?.can_manage_members && (
                      <td className="px-8 py-5 text-right">
                        {m.role !== "owner" && m.user?.email !== user?.email && (
                          <button
                            onClick={() => handleRemove(m.id)}
                            disabled={removingId === m.id}
                            className="p-2 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
                          >
                            {removingId === m.id ? (
                              <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                            ) : (
                              <TrashIcon className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Inviter un membre</h3>
              <button onClick={() => { setShowInviteModal(false); setInviteError(null); }} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-300 mb-2 block">Adresse e-mail</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="prenom.nom@entreprise.com"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50"
                  onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-300 mb-2 block">Rôle</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="admin">Administrateur</option>
                  <option value="manager">Gestionnaire</option>
                  <option value="member">Membre</option>
                </select>
              </div>

              {inviteError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                  {inviteError}
                </div>
              )}

              <button
                onClick={handleInvite}
                disabled={inviting || !inviteEmail.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-sm shadow-lg shadow-indigo-500/20"
              >
                {inviting ? "Invitation en cours..." : "Inviter le membre"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
