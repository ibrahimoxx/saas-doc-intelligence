// src/app/(dashboard)/espaces/profiles/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { tenantService } from "@/services/tenant.service";
import type {
  TenantMembership,
  TenantPermissions,
  KnowledgeSpace,
  SpaceAccessProfile,
} from "@/types/tenant.types";
import { TopBar } from "@/components/layout/TopBar";
import {
  Layers,
  Plus,
  Trash2,
  X,
  Check,
  Loader2,
  ArrowLeft,
  Folder,
  Edit,
} from "lucide-react";

export default function SpaceProfilesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  const [tenants, setTenants] = useState<TenantMembership[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<TenantPermissions | null>(null);
  const [loadingPermissions, setLoadingPermissions] = useState(true);

  const [profiles, setProfiles] = useState<SpaceAccessProfile[]>([]);
  const [spaces, setSpaces] = useState<KnowledgeSpace[]>([]);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<SpaceAccessProfile | null>(null);
  const [form, setForm] = useState({ name: "", description: "", space_ids: [] as string[] });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (permissions && permissions.role !== "admin" && permissions.role !== "owner") {
      router.replace("/dashboard");
    }
  }, [permissions, router]);

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

  const loadData = useCallback(async (tenantId: string) => {
    setLoading(true);
    const [profilesRes, spacesRes, permsRes] = await Promise.all([
      tenantService.listSpaceProfiles(tenantId),
      tenantService.knowledgeSpaces(tenantId),
      tenantService.myPermissions(tenantId),
    ]);
    if (profilesRes.data) setProfiles(profilesRes.data);
    if (spacesRes.data) setSpaces(spacesRes.data);
    if (permsRes.data) setPermissions(permsRes.data);
    setLoadingPermissions(false);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (selectedTenantId) loadData(selectedTenantId);
  }, [selectedTenantId, loadData]);

  const openCreate = () => {
    setEditingProfile(null);
    setForm({ name: "", description: "", space_ids: [] });
    setFormError(null);
    setShowModal(true);
  };

  const openEdit = (profile: SpaceAccessProfile) => {
    setEditingProfile(profile);
    setForm({
      name: profile.name,
      description: profile.description,
      space_ids: profile.spaces.map((s) => s.id),
    });
    setFormError(null);
    setShowModal(true);
  };

  const toggleSpace = (spaceId: string) => {
    setForm((prev) => ({
      ...prev,
      space_ids: prev.space_ids.includes(spaceId)
        ? prev.space_ids.filter((id) => id !== spaceId)
        : [...prev.space_ids, spaceId],
    }));
  };

  const handleSave = async () => {
    if (!selectedTenantId || !form.name.trim()) return;
    setSaving(true);
    setFormError(null);

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      space_ids: form.space_ids,
    };

    const res = editingProfile
      ? await tenantService.updateSpaceProfile(selectedTenantId, editingProfile.id, payload)
      : await tenantService.createSpaceProfile(selectedTenantId, payload);

    if (res.error) {
      setFormError(res.error.message);
    } else {
      setShowModal(false);
      loadData(selectedTenantId);
    }
    setSaving(false);
  };

  const handleDelete = async (profileId: string, name: string) => {
    if (!selectedTenantId || !confirm(`Supprimer le profil "${name}" ? Les utilisateurs assignés perdront cet accès.`)) return;
    await tenantService.deleteSpaceProfile(selectedTenantId, profileId);
    loadData(selectedTenantId);
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (isLoading || loadingPermissions || (!isAuthenticated && !isLoading)) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-10 h-10 border-[3px] border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  const isAuthorized = permissions?.role === "admin" || permissions?.role === "owner";
  if (!isAuthorized) return null;

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

      <main className="max-w-[1400px] mx-auto px-12 py-48 space-y-24">
        {/* Header */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-12 animate-fluid-in">
          <div className="space-y-6">
            <button
              onClick={() => router.push("/espaces")}
              className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest"
            >
              <ArrowLeft className="w-4 h-4" /> Retour aux Espaces
            </button>
            <h2 className="text-hero leading-tight">
              Profils <br />
              <span className="text-gradient">d'Accès</span>
            </h2>
            <p className="text-slate-400 text-lg font-medium max-w-xl">
              Créez des profils réutilisables regroupant plusieurs espaces, puis assignez-les à vos membres.
            </p>
          </div>

          <button
            onClick={openCreate}
            className="btn-magnetic flex items-center gap-4 interactive-premium"
          >
            <Plus className="w-5 h-5" />
            <span>Nouveau Profil</span>
          </button>
        </header>

        {/* Profiles grid */}
        {loading ? (
          <div className="py-32 flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-400" />
          </div>
        ) : profiles.length === 0 ? (
          <div className="fluid-card max-w-2xl mx-auto text-center space-y-10 py-24 animate-fluid-in">
            <div className="w-24 h-24 rounded-[32px] bg-purple-500/5 flex items-center justify-center mx-auto">
              <Layers className="w-12 h-12 text-purple-400" />
            </div>
            <div className="space-y-3">
              <h3 className="text-3xl font-black tracking-tighter text-white text-gradient">Aucun profil</h3>
              <p className="text-slate-400 font-medium">
                Créez votre premier profil pour gérer l'accès de plusieurs utilisateurs d'un coup.
              </p>
            </div>
            <button onClick={openCreate} className="btn-magnetic interactive-premium">
              Créer un profil
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 animate-fluid-in">
            {profiles.map((profile, i) => (
              <div
                key={profile.id}
                className="fluid-card space-y-8"
                style={{ animationDelay: `${(i + 1) * 80}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                    <Layers className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEdit(profile)}
                      className="glass-trigger"
                      title="Modifier"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(profile.id, profile.name)}
                      className="glass-trigger text-red-400/60 hover:text-red-400"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-black tracking-tighter text-white">{profile.name}</h3>
                  <p className="text-slate-500 text-sm font-medium line-clamp-2">
                    {profile.description || "Aucune description."}
                  </p>
                </div>

                <div className="space-y-3 pt-4 border-t border-white/5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">
                    {profile.spaces.length} espace{profile.spaces.length !== 1 ? "s" : ""}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {profile.spaces.map((space) => (
                      <span
                        key={space.id}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-black uppercase tracking-widest"
                      >
                        <Folder className="w-2.5 h-2.5" />
                        {space.name}
                      </span>
                    ))}
                    {profile.spaces.length === 0 && (
                      <span className="text-[10px] text-slate-600">Aucun espace sélectionné</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-[#020617]/95 backdrop-blur-3xl"
            onClick={() => !saving && setShowModal(false)}
          />
          <div className="relative w-full max-w-2xl bg-white/[0.02] border border-white/10 rounded-[64px] p-16 shadow-2xl animate-fluid-in">
            <header className="flex justify-between items-start mb-12">
              <div className="space-y-3">
                <h3 className="text-4xl font-black tracking-tighter text-white uppercase text-gradient">
                  {editingProfile ? "Modifier le profil" : "Nouveau profil"}
                </h3>
                <p className="text-slate-400 font-medium">Définissez les espaces accessibles via ce profil.</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-14 h-14 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all interactive-premium"
              >
                <X className="w-6 h-6" />
              </button>
            </header>

            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Nom du profil</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Accès Comptabilité"
                  className="w-full bg-white/5 border border-white/5 rounded-[24px] px-8 py-5 text-white focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Description optionnelle..."
                  className="w-full bg-white/5 border border-white/5 rounded-[24px] px-8 py-5 text-white focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">
                  Espaces inclus ({form.space_ids.length}/{spaces.length})
                </label>
                <div className="flex flex-wrap gap-3">
                  {spaces.map((space) => {
                    const selected = form.space_ids.includes(space.id);
                    return (
                      <button
                        key={space.id}
                        onClick={() => toggleSpace(space.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all interactive-premium ${
                          selected
                            ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-300"
                            : "bg-white/5 border-white/5 text-slate-500 hover:text-white hover:border-white/20"
                        }`}
                      >
                        {selected && <Check className="w-3 h-3" />}
                        <Folder className="w-3 h-3" />
                        {space.name}
                      </button>
                    );
                  })}
                  {spaces.length === 0 && (
                    <p className="text-[10px] text-slate-600">Aucun espace disponible dans cette organisation.</p>
                  )}
                </div>
              </div>

              {formError && (
                <div className="p-5 bg-red-500/5 border border-red-500/10 rounded-[24px] text-red-400 text-sm font-bold">
                  {formError}
                </div>
              )}

              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
                className="btn-magnetic w-full py-6 interactive-premium"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : editingProfile ? "Enregistrer les modifications" : "Créer le profil"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
