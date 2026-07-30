"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTenants } from "@/hooks/useTenants";
import { tenantService } from "@/services/tenant.service";
import type {
  TenantPermissions,
  KnowledgeSpace,
  SpaceAccessProfile,
} from "@/types/tenant.types";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { Modal } from "@/components/ui/Modal";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import {
  Layers,
  Plus,
  Trash2,
  Check,
  Loader2,
  ArrowLeft,
  Folder,
  Pencil,
} from "lucide-react";

export default function SpaceProfilesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  const { selectedTenantId } = useTenants();
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

  if (isLoading || loadingPermissions || (!isAuthenticated && !isLoading)) {
    return <PageLoader />;
  }

  const isAuthorized = permissions?.role === "admin" || permissions?.role === "owner";
  if (!isAuthorized) return null;

  return (
    <div className="px-8 pb-12 pt-7">
      {/* Header */}
      <div className="mb-[18px] flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <button
            onClick={() => router.push("/espaces")}
            className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-fg-tertiary transition-colors hover:text-fg-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour aux Espaces
          </button>
          <h1 className="text-[22px] font-bold text-fg-primary">Profils d&apos;accès</h1>
          <p className="mt-1 max-w-xl text-[13px] text-fg-secondary">
            Profils réutilisables regroupant plusieurs espaces, assignables à vos membres.
          </p>
        </div>

        <button type="button" onClick={openCreate} className="dc-btn-primary">
          <Plus className="h-3.5 w-3.5" />
          Nouveau profil
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="dc-card flex items-center justify-center py-24">
          <Loader2 className="h-5 w-5 animate-spin text-brand-primary" />
        </div>
      ) : profiles.length === 0 ? (
        <div className="dc-card flex flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-soft">
            <Layers className="h-5 w-5 text-brand-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-[14.5px] font-semibold text-fg-primary">Aucun profil d&apos;accès</p>
            <p className="mx-auto max-w-sm text-[13px] text-fg-secondary">
              Créez votre premier profil pour gérer l&apos;accès de plusieurs utilisateurs d&apos;un
              coup.
            </p>
          </div>
          <button type="button" onClick={openCreate} className="dc-btn">
            <Plus className="h-3.5 w-3.5" />
            Créer un profil
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => (
            <div key={profile.id} className="dc-card group flex flex-col gap-3 p-4">
              {/* Header row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-primary">
                  <Layers className="h-[17px] w-[17px]" />
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(profile)}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-fg-tertiary transition-colors hover:border-border-subtle hover:bg-bg-elevated-1 hover:text-fg-primary"
                    title="Modifier"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(profile.id, profile.name)}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-fg-tertiary transition-colors hover:border-error-border hover:bg-error-bg hover:text-error"
                    title="Supprimer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Name + description */}
              <div>
                <p className="text-[14.5px] font-semibold text-fg-primary">{profile.name}</p>
                <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-fg-tertiary">
                  {profile.description || "Aucune description."}
                </p>
              </div>

              {/* Spaces */}
              <div className="border-t border-border-subtle pt-2.5">
                <p className="dc-label">
                  {profile.spaces.length} espace{profile.spaces.length === 1 ? "" : "s"}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {profile.spaces.map((space) => (
                    <span
                      key={space.id}
                      className="inline-flex items-center gap-1 rounded-md border border-transparent bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand-primary"
                    >
                      <Folder className="h-2.5 w-2.5" />
                      {space.name}
                    </span>
                  ))}
                  {profile.spaces.length === 0 && (
                    <span className="text-[11.5px] text-fg-tertiary">
                      Aucun espace sélectionné
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      <Modal isOpen={showModal} onClose={() => !saving && setShowModal(false)} width="max-w-xl">
        <div className="space-y-4">
          <div>
            <h2 className="text-[17px] font-bold text-fg-primary">
              {editingProfile ? "Modifier le profil" : "Nouveau profil"}
            </h2>
            <p className="mt-1 text-[13px] text-fg-secondary">
              Définissez les espaces accessibles via ce profil.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="dc-label" htmlFor="profile-name">
              Nom du profil
            </label>
            <input
              id="profile-name"
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex : Accès Comptabilité"
              className="dc-input"
            />
          </div>

          <div className="space-y-1.5">
            <label className="dc-label" htmlFor="profile-description">
              Description
            </label>
            <input
              id="profile-description"
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Description optionnelle…"
              className="dc-input"
            />
          </div>

          <div className="space-y-1.5">
            <p className="dc-label">
              Espaces inclus ({form.space_ids.length}/{spaces.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {spaces.map((space) => {
                const selected = form.space_ids.includes(space.id);
                return (
                  <button
                    key={space.id}
                    onClick={() => toggleSpace(space.id)}
                    className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11.5px] font-semibold transition-colors ${
                      selected
                        ? "border-brand-primary bg-brand-soft text-brand-primary"
                        : "border-border-subtle bg-bg-base text-fg-secondary hover:border-border-strong hover:text-fg-primary"
                    }`}
                  >
                    {selected && <Check className="h-3 w-3" />}
                    <Folder className="h-3 w-3" />
                    {space.name}
                  </button>
                );
              })}
              {spaces.length === 0 && (
                <p className="text-[12px] text-fg-tertiary">
                  Aucun espace disponible dans cette organisation.
                </p>
              )}
            </div>
          </div>

          {formError && <ErrorBanner message={formError} dismissible={false} />}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              disabled={saving}
              className="dc-btn"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.name.trim()}
              className="dc-btn-primary"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : editingProfile ? (
                "Enregistrer"
              ) : (
                "Créer le profil"
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
