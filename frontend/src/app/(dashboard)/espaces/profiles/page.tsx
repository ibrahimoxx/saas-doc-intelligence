"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useTenants } from "@/hooks/useTenants";
import { tenantService } from "@/services/tenant.service";
import type {
  TenantPermissions,
  KnowledgeSpace,
  SpaceAccessProfile,
} from "@/types/tenant.types";
import { TopBar } from "@/components/layout/TopBar";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { staggerContainer, fadeUp } from "@/lib/motion";
import {
  Layers,
  Plus,
  Trash2,
  X,
  Check,
  Loader2,
  ArrowLeft,
  Folder,
  Pencil,
} from "lucide-react";

const reducedFadeUp = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const reducedStagger = { hidden: {}, visible: {} };

export default function SpaceProfilesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const shouldReduceMotion = useReducedMotion();

  const { tenants, selectedTenantId, setSelectedTenantId } = useTenants();
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
    return <PageLoader />;
  }

  const isAuthorized = permissions?.role === "admin" || permissions?.role === "owner";
  if (!isAuthorized) return null;

  return (
    <div className="min-h-screen bg-bg-base">
      <TopBar
        userEmail={user?.email}
        isSuperuser={user?.is_superuser}
        tenants={tenants}
        selectedTenantId={selectedTenantId}
        onTenantChange={setSelectedTenantId}
        onLogout={handleLogout}
        onAdminDashboard={() => router.push("/admin/dashboard")}
      />

      <main id="main" className="mx-auto max-w-6xl px-6 pt-28 pb-16">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={shouldReduceMotion ? reducedStagger : staggerContainer}
          className="space-y-10"
        >
          {/* Header */}
          <motion.div
            variants={shouldReduceMotion ? reducedFadeUp : fadeUp}
            className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6"
          >
            <div className="space-y-4">
              <button
                onClick={() => router.push("/espaces")}
                className="flex items-center gap-1.5 text-xs font-semibold text-fg-tertiary hover:text-fg-primary transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Retour aux Espaces
              </button>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-fg-tertiary">
                  Gestion des accès
                </p>
                <h1 className="font-serif text-4xl tracking-tight text-fg-primary sm:text-5xl">
                  Profils <span className="text-gradient">d'Accès</span>
                </h1>
              </div>
              <p className="text-sm text-fg-secondary max-w-lg">
                Créez des profils réutilisables regroupant plusieurs espaces, puis assignez-les à vos membres.
              </p>
            </div>

            <button
              onClick={openCreate}
              className="flex shrink-0 items-center gap-2 rounded-2xl aurora-bg px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(99,102,241,0.5)] transition-opacity hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Nouveau Profil
            </button>
          </motion.div>

          {/* Content */}
          <motion.div variants={shouldReduceMotion ? reducedFadeUp : fadeUp}>
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <div className="h-6 w-6 rounded-full border-2 border-bg-elevated-3 border-t-brand-primary animate-spin" />
              </div>
            ) : profiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-6 rounded-[28px] border border-border-subtle bg-bg-elevated-1/60 py-20 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border-strong bg-bg-elevated-2">
                  <Layers className="h-8 w-8 text-brand-secondary" />
                </div>
                <div className="space-y-2">
                  <p className="font-display text-lg font-semibold text-fg-primary">Aucun profil d'accès</p>
                  <p className="text-sm text-fg-secondary max-w-sm">
                    Créez votre premier profil pour gérer l'accès de plusieurs utilisateurs d'un coup.
                  </p>
                </div>
                <button
                  onClick={openCreate}
                  className="flex items-center gap-2 rounded-2xl border border-brand-primary/20 bg-brand-primary/10 px-5 py-2.5 text-sm font-semibold text-brand-primary transition-colors hover:bg-brand-primary/20"
                >
                  <Plus className="h-4 w-4" />
                  Créer un profil
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {profiles.map((profile, i) => (
                  <motion.div
                    key={profile.id}
                    initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group relative flex flex-col gap-5 rounded-[28px] border border-border-subtle bg-bg-elevated-1/60 p-6 transition-shadow hover:shadow-card"
                  >
                    {/* Header row */}
                    <div className="flex items-start justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border-strong bg-bg-elevated-2">
                        <Layers className="h-5 w-5 text-brand-secondary" />
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(profile)}
                          className="flex h-8 w-8 items-center justify-center rounded-xl border border-border-subtle bg-bg-elevated-2 text-fg-tertiary transition-colors hover:text-fg-primary"
                          title="Modifier"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(profile.id, profile.name)}
                          className="flex h-8 w-8 items-center justify-center rounded-xl border border-border-subtle bg-bg-elevated-2 text-fg-tertiary transition-colors hover:text-error"
                          title="Supprimer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Name + description */}
                    <div className="space-y-1">
                      <p className="font-display text-base font-semibold text-fg-primary">{profile.name}</p>
                      <p className="text-xs text-fg-tertiary line-clamp-2">
                        {profile.description || "Aucune description."}
                      </p>
                    </div>

                    {/* Spaces */}
                    <div className="space-y-2 border-t border-border-subtle pt-4">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-fg-tertiary">
                        {profile.spaces.length} espace{profile.spaces.length !== 1 ? "s" : ""}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {profile.spaces.map((space) => (
                          <span
                            key={space.id}
                            className="flex items-center gap-1 rounded-lg border border-brand-primary/20 bg-brand-primary/10 px-2 py-1 text-[10px] font-semibold text-brand-primary"
                          >
                            <Folder className="h-2.5 w-2.5" />
                            {space.name}
                          </span>
                        ))}
                        {profile.spaces.length === 0 && (
                          <span className="text-[10px] text-fg-muted">Aucun espace sélectionné</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      </main>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 flex items-center justify-center p-6"
          >
            <div
              className="absolute inset-0 bg-bg-base/90 backdrop-blur-sm"
              onClick={() => !saving && setShowModal(false)}
            />
            <motion.div
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.25 }}
              className="relative w-full max-w-xl rounded-[28px] border border-border-strong bg-bg-elevated-1 p-8 shadow-card-lift"
            >
              {/* Aurora accent bar */}
              <div className="absolute inset-x-0 top-0 h-0.5 aurora-bg rounded-t-[28px]" />

              {/* Modal header */}
              <div className="mb-6 flex items-start justify-between">
                <div className="space-y-0.5">
                  <h2 className="font-serif text-2xl text-fg-primary">
                    {editingProfile ? "Modifier le profil" : "Nouveau profil"}
                  </h2>
                  <p className="text-xs text-fg-tertiary">Définissez les espaces accessibles via ce profil.</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-border-subtle text-fg-tertiary transition-colors hover:text-fg-primary"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-5">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-widest text-fg-tertiary">
                    Nom du profil
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ex: Accès Comptabilité"
                    className="w-full rounded-2xl border border-border-subtle bg-bg-elevated-2 px-4 py-3 text-sm text-fg-primary placeholder:text-fg-tertiary focus:border-brand-primary/50 focus:outline-none transition-colors"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-widest text-fg-tertiary">
                    Description
                  </label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Description optionnelle..."
                    className="w-full rounded-2xl border border-border-subtle bg-bg-elevated-2 px-4 py-3 text-sm text-fg-primary placeholder:text-fg-tertiary focus:border-brand-primary/50 focus:outline-none transition-colors"
                  />
                </div>

                {/* Spaces */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-widest text-fg-tertiary">
                    Espaces inclus ({form.space_ids.length}/{spaces.length})
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {spaces.map((space) => {
                      const selected = form.space_ids.includes(space.id);
                      return (
                        <button
                          key={space.id}
                          onClick={() => toggleSpace(space.id)}
                          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                            selected
                              ? "border-brand-primary/30 bg-brand-primary/15 text-brand-primary"
                              : "border-border-subtle bg-bg-elevated-2 text-fg-tertiary hover:text-fg-primary"
                          }`}
                        >
                          {selected && <Check className="h-3 w-3" />}
                          <Folder className="h-3 w-3" />
                          {space.name}
                        </button>
                      );
                    })}
                    {spaces.length === 0 && (
                      <p className="text-xs text-fg-muted">Aucun espace disponible dans cette organisation.</p>
                    )}
                  </div>
                </div>

                {formError && (
                  <div className="rounded-2xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
                    {formError}
                  </div>
                )}

                <button
                  onClick={handleSave}
                  disabled={saving || !form.name.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl aurora-bg py-3 text-sm font-semibold text-white shadow-[0_4px_16px_-4px_rgba(99,102,241,0.5)] transition-opacity disabled:opacity-30"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : editingProfile ? (
                    "Enregistrer les modifications"
                  ) : (
                    "Créer le profil"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
