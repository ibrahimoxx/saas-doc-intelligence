"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useTenants } from "@/hooks/useTenants";
import { tenantService } from "@/services/tenant.service";
import type { KnowledgeSpace, TenantPermissions } from "@/types/tenant.types";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { EmptySpaces } from "@/components/illustrations/EmptySpaces";
import {
  Plus,
  Folder,
  ArrowUpRight,
  FileText,
  MoreVertical,
  Trash2,
  Layers,
  Loader2,
} from "lucide-react";

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function EspacesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  const { selectedTenantId } = useTenants();
  const [spaces, setSpaces] = useState<KnowledgeSpace[]>([]);
  const [permissions, setPermissions] = useState<TenantPermissions | null>(null);
  const [loadingSpaces, setLoadingSpaces] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", description: "" });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (permissions && permissions.role !== "admin" && permissions.role !== "owner" && !permissions.can_manage_members) {
      router.replace("/dashboard");
    }
  }, [permissions, router]);

  const loadData = useCallback(async (tenantId: string) => {
    setLoadingSpaces(true);
    const [spacesRes, permsRes] = await Promise.all([
      tenantService.knowledgeSpaces(tenantId),
      tenantService.myPermissions(tenantId),
    ]);
    if (spacesRes.data) setSpaces(spacesRes.data);
    if (permsRes.data) setPermissions(permsRes.data);
    setLoadingPermissions(false);
    setLoadingSpaces(false);
  }, []);

  useEffect(() => {
    if (selectedTenantId) loadData(selectedTenantId);
  }, [selectedTenantId, loadData]);

  const handleCreate = async () => {
    if (!selectedTenantId || !form.name.trim() || !form.slug.trim()) return;
    setCreating(true);
    setCreateError(null);
    const res = await tenantService.createSpace(selectedTenantId, {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim(),
    });
    if (res.error) {
      setCreateError(res.error.message);
    } else {
      setShowCreateModal(false);
      setForm({ name: "", slug: "", description: "" });
      loadData(selectedTenantId);
    }
    setCreating(false);
  };

  const handleDeleteSpace = async (spaceId: string) => {
    if (!selectedTenantId || !confirm("Supprimer cet espace et tous ses documents ?")) return;
    await tenantService.deleteSpace(selectedTenantId, spaceId);
    loadData(selectedTenantId);
    setOpenMenuId(null);
  };

  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  if (isLoading || loadingPermissions || (!isAuthenticated && !isLoading)) return <PageLoader />;

  const isAuthorized =
    permissions?.role === "admin" ||
    permissions?.role === "owner" ||
    permissions?.can_manage_members;
  if (!isAuthorized) return null;

  const isAdmin = permissions?.role === "admin" || permissions?.role === "owner";

  return (
    <div className="px-8 pb-12 pt-7">
      {/* Header */}
      <div className="mb-[18px] flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="text-[22px] font-bold text-fg-primary">Espaces</h1>
          <p className="mt-1 text-[13px] text-fg-secondary">
            {spaces.length} espace{spaces.length === 1 ? "" : "s"} de travail isolé
            {spaces.length === 1 ? "" : "s"} au sein du tenant
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              type="button"
              onClick={() => router.push("/espaces/profiles")}
              className="dc-btn"
            >
              <Layers className="h-3.5 w-3.5" />
              Profils d&apos;accès
            </button>
          )}
          {permissions?.can_upload && (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="dc-btn-primary"
            >
              <Plus className="h-3.5 w-3.5" />
              Créer un espace
            </button>
          )}
        </div>
      </div>

      {/* Spaces grid */}
      {loadingSpaces ? (
        <div className="dc-card flex items-center justify-center py-24">
          <Loader2 className="h-5 w-5 animate-spin text-brand-primary" />
        </div>
      ) : spaces.length === 0 ? (
        <div className="dc-card py-16">
          <EmptyState
            illustration={<EmptySpaces className="mx-auto" />}
            title="Aucun espace"
            description="Créez votre premier espace de travail pour indexer vos documents."
            actionLabel={permissions?.can_upload ? "Créer un espace" : undefined}
            onAction={permissions?.can_upload ? () => setShowCreateModal(true) : undefined}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {spaces.map((space) => (
            <div key={space.id} className="dc-card flex flex-col gap-3 p-4">
              {/* Top row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-primary">
                  <Folder className="h-[17px] w-[17px]" />
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex rounded-[5px] border px-2 py-0.5 text-[10.5px] font-semibold ${
                      space.is_active
                        ? "border-success-border bg-success-bg text-success"
                        : "border-border-subtle bg-bg-elevated-1 text-fg-tertiary"
                    }`}
                  >
                    {space.is_active ? "Actif" : "Hors ligne"}
                  </span>

                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === space.id ? null : space.id);
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-fg-tertiary transition-colors hover:border-border-subtle hover:bg-bg-elevated-1 hover:text-fg-primary"
                      aria-label="Options"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    <AnimatePresence>
                      {openMenuId === space.id && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.12 }}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 top-full z-50 mt-1.5 w-40 overflow-hidden rounded-lg border border-border-subtle bg-bg-elevated-2 shadow-card-lift"
                        >
                          <button
                            onClick={() => router.push(`/documents?space=${space.id}`)}
                            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-[12px] font-semibold text-fg-secondary transition-colors hover:bg-bg-elevated-1 hover:text-fg-primary"
                          >
                            <ArrowUpRight className="h-3.5 w-3.5 text-brand-primary" />
                            Ouvrir
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteSpace(space.id)}
                              className="flex w-full items-center gap-2.5 border-t border-border-subtle px-3 py-2.5 text-[12px] font-semibold text-error transition-colors hover:bg-error-bg"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Supprimer
                            </button>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div>
                <h3 className="text-[14.5px] font-semibold text-fg-primary">{space.name}</h3>
                <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-fg-tertiary">
                  {space.description || "Aucune description fournie."}
                </p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-border-subtle pt-2.5">
                <span className="flex items-center gap-1.5 text-[12px] text-fg-secondary">
                  <FileText className="h-3.5 w-3.5 text-fg-tertiary" />
                  {space.document_count ?? 0} document
                  {(space.document_count ?? 0) === 1 ? "" : "s"}
                </span>
                <button
                  onClick={() => router.push(`/documents?space=${space.id}`)}
                  className="flex items-center gap-1 text-[12px] font-semibold text-fg-tertiary transition-colors hover:text-brand-primary"
                >
                  Ouvrir
                  <ArrowUpRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => !creating && setShowCreateModal(false)}
        width="max-w-lg"
      >
        <div className="space-y-5">
          <div>
            <h2 className="text-[17px] font-bold text-fg-primary">Créer un espace</h2>
            <p className="mt-1 text-[13px] text-fg-secondary">
              Compartimentez vos documents par département ou projet.
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Nom"
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) })
                }
                placeholder="Ventes France"
              />
              <div className="space-y-1.5">
                <label className="dc-label" htmlFor="space-slug">
                  Slug
                </label>
                <input
                  id="space-slug"
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
                  className="dc-input font-mono text-brand-primary"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="dc-label" htmlFor="space-description">
                Description
              </label>
              <textarea
                id="space-description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Décrivez l'usage de cet espace…"
                rows={3}
                className="dc-input resize-none"
              />
            </div>

            {createError && <ErrorBanner message={createError} dismissible={false} />}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                disabled={creating}
                className="dc-btn"
              >
                Annuler
              </button>
              <Button
                variant="primary"
                size="md"
                onClick={handleCreate}
                loading={creating}
                disabled={creating || !form.name.trim() || !form.slug.trim()}
              >
                {creating ? "Création…" : "Créer l'espace"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
