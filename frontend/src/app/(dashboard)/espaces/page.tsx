"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { tenantService } from "@/services/tenant.service";
import type { TenantMembership, KnowledgeSpace, TenantPermissions } from "@/types/tenant.types";
import { TopBar } from "@/components/layout/TopBar";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { EmptySpaces } from "@/components/illustrations/EmptySpaces";
import { fadeUp, staggerContainer } from "@/lib/motion";
import {
  Plus,
  Folder,
  X,
  ArrowUpRight,
  FileText,
  MoreVertical,
  Trash2,
  Layers,
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
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const shouldReduceMotion = useReducedMotion();

  const [tenants, setTenants] = useState<TenantMembership[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
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

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (isLoading || loadingPermissions || (!isAuthenticated && !isLoading)) return <PageLoader />;

  const isAuthorized =
    permissions?.role === "admin" ||
    permissions?.role === "owner" ||
    permissions?.can_manage_members;
  if (!isAuthorized) return null;

  const isAdmin = permissions?.role === "admin" || permissions?.role === "owner";

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
          variants={shouldReduceMotion ? {} : staggerContainer}
          className="space-y-10"
        >
          {/* Header */}
          <motion.header
            variants={shouldReduceMotion ? { hidden: { opacity: 0 }, visible: { opacity: 1 } } : fadeUp}
            className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
          >
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-fg-tertiary">
                Espaces de connaissance
              </p>
              <h1 className="font-serif text-4xl tracking-tight text-fg-primary sm:text-5xl">
                Espaces
              </h1>
              <p className="text-sm text-fg-secondary">
                Compartimentez vos données pour une analyse par département ou projet.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Layers className="h-4 w-4" />}
                  onClick={() => router.push("/espaces/profiles")}
                >
                  Profils d&apos;accès
                </Button>
              )}
              {permissions?.can_upload && (
                <Button
                  variant="primary"
                  size="md"
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={() => setShowCreateModal(true)}
                >
                  Nouvel espace
                </Button>
              )}
            </div>
          </motion.header>

          {/* Spaces grid */}
          <motion.section
            variants={shouldReduceMotion ? { hidden: { opacity: 0 }, visible: { opacity: 1 } } : fadeUp}
          >
            {loadingSpaces ? (
              <div className="flex items-center justify-center py-24">
                <div className="h-8 w-8 rounded-full border-2 border-bg-elevated-3 border-t-brand-primary animate-spin" />
              </div>
            ) : spaces.length === 0 ? (
              <div className="rounded-[28px] border border-border-subtle bg-bg-elevated-1/60 py-20">
                <EmptyState
                  illustration={<EmptySpaces className="mx-auto" />}
                  title="Prêt à uploader ?"
                  description="Créez votre premier espace de travail pour indexer vos documents PDF."
                  actionLabel={permissions?.can_upload ? "Démarrer l'aventure" : undefined}
                  onAction={permissions?.can_upload ? () => setShowCreateModal(true) : undefined}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {spaces.map((space, i) => (
                  <motion.div
                    key={space.id}
                    initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group relative overflow-hidden rounded-xl border border-border-subtle bg-bg-elevated-1/60 p-5 transition-shadow hover:shadow-card"
                  >
                    {/* Subtle glow on hover */}
                    <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl"
                      style={{ background: "radial-gradient(circle at 30% 20%, rgba(99,102,241,0.06), transparent 60%)" }}
                    />

                    <div className="relative flex flex-col gap-5">
                      {/* Top row */}
                      <div className="flex items-start justify-between">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border-subtle bg-bg-elevated-2 text-brand-primary">
                          <Folder className="h-5 w-5" />
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest ${
                              space.is_active
                                ? "bg-success/10 text-success"
                                : "bg-bg-elevated-2 text-fg-tertiary"
                            }`}
                          >
                            {space.is_active ? "Prêt" : "Hors ligne"}
                          </span>

                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(openMenuId === space.id ? null : space.id);
                              }}
                              className="flex h-8 w-8 items-center justify-center rounded-xl border border-border-subtle bg-bg-elevated-2 text-fg-tertiary transition-colors hover:text-fg-primary"
                              aria-label="Options"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>

                            <AnimatePresence>
                              {openMenuId === space.id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                  transition={{ duration: 0.15 }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-2xl border border-border-subtle bg-bg-elevated-2 shadow-[0_24px_48px_-16px_rgba(0,0,0,0.8)]"
                                >
                                  <button
                                    onClick={() => router.push(`/documents?space=${space.id}`)}
                                    className="flex w-full items-center gap-3 px-4 py-3 text-xs font-semibold text-fg-secondary transition-colors hover:bg-bg-elevated-3 hover:text-fg-primary"
                                  >
                                    <ArrowUpRight className="h-3.5 w-3.5 text-brand-primary" />
                                    Ouvrir
                                  </button>
                                  {isAdmin && (
                                    <button
                                      onClick={() => handleDeleteSpace(space.id)}
                                      className="flex w-full items-center gap-3 border-t border-border-subtle px-4 py-3 text-xs font-semibold text-error transition-colors hover:bg-error/10"
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
                      <div className="space-y-1">
                        <h3 className="font-display text-lg font-semibold text-fg-primary group-hover:text-brand-primary transition-colors">
                          {space.name}
                        </h3>
                        <p className="line-clamp-2 text-xs leading-5 text-fg-tertiary">
                          {space.description || "Aucune description fournie."}
                        </p>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between border-t border-border-subtle pt-4">
                        <div className="flex items-center gap-1.5 text-xs text-fg-tertiary">
                          <FileText className="h-3.5 w-3.5" />
                          <span>{space.document_count ?? 0} document{(space.document_count ?? 0) !== 1 ? "s" : ""}</span>
                        </div>
                        <button
                          onClick={() => router.push(`/documents?space=${space.id}`)}
                          className="flex items-center gap-1 text-xs font-semibold text-fg-tertiary transition-colors group-hover:text-brand-primary"
                        >
                          <span>Ouvrir</span>
                          <ArrowUpRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.section>
        </motion.div>
      </main>

      {/* Create modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 flex items-center justify-center p-6"
          >
            <div
              className="absolute inset-0 bg-bg-base/90 backdrop-blur-md"
              onClick={() => !creating && setShowCreateModal(false)}
            />

            <motion.div
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.25 }}
              className="relative w-full max-w-lg overflow-hidden rounded-[32px] border border-border-subtle bg-bg-elevated-1 shadow-[0_40px_120px_-32px_rgba(0,0,0,0.9)]"
            >
              <div className="h-px w-full aurora-bg" />

              <div className="p-8">
                <div className="mb-8 flex items-start justify-between">
                  <div className="space-y-1">
                    <h2 className="font-serif text-3xl tracking-tight text-fg-primary">
                      Initialisation
                    </h2>
                    <p className="text-sm text-fg-secondary">
                      Configurez les paramètres de l&apos;espace.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-border-subtle bg-bg-elevated-2 text-fg-tertiary transition-colors hover:text-fg-primary"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
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
                      <label className="text-xs font-semibold uppercase tracking-widest text-fg-tertiary">
                        Slug
                      </label>
                      <input
                        type="text"
                        value={form.slug}
                        onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
                        className="w-full rounded-xl border border-border-subtle bg-bg-elevated-2 px-3 py-2.5 font-mono text-sm text-brand-primary focus:border-brand-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-widest text-fg-tertiary">
                      Description
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Décrivez l'usage de cet espace…"
                      rows={3}
                      className="w-full resize-none rounded-xl border border-border-subtle bg-bg-elevated-2 px-3 py-2.5 text-sm text-fg-primary placeholder:text-fg-tertiary focus:border-brand-primary focus:outline-none"
                    />
                  </div>

                  {createError && <ErrorBanner message={createError} dismissible={false} />}

                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={handleCreate}
                    loading={creating}
                    disabled={creating || !form.name.trim() || !form.slug.trim()}
                  >
                    {creating ? "Initialisation…" : "Confirmer l'initialisation"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
