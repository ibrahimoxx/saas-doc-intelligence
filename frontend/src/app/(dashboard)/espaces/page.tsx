"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { tenantService } from "@/services/tenant.service";
import type { TenantMembership, KnowledgeSpace, TenantPermissions } from "@/types/tenant.types";
import {
  BookOpenIcon,
  PlusIcon,
  FolderIcon,
  DocumentTextIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function EspacesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  const [tenants, setTenants] = useState<TenantMembership[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [spaces, setSpaces] = useState<KnowledgeSpace[]>([]);
  const [permissions, setPermissions] = useState<TenantPermissions | null>(null);
  const [loadingSpaces, setLoadingSpaces] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", description: "" });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

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
    setLoadingSpaces(true);
    const [spacesRes, permsRes] = await Promise.all([
      tenantService.knowledgeSpaces(tenantId),
      tenantService.myPermissions(tenantId),
    ]);
    if (spacesRes.data) setSpaces(spacesRes.data);
    if (permsRes.data) setPermissions(permsRes.data);
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
          <button
            onClick={() => router.push("/dashboard")}
            className="text-slate-400 hover:text-white transition-colors text-sm flex items-center space-x-2"
          >
            <span>←</span><span>Dashboard</span>
          </button>
          <div className="h-4 w-px bg-slate-700" />
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <BookOpenIcon className="w-4 h-4 text-purple-400" />
            </div>
            <h1 className="font-bold text-white">Espaces de connaissance</h1>
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
          {permissions?.can_upload && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-purple-500/20"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Nouvel espace</span>
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        {/* Page Title */}
        <div>
          <h2 className="text-3xl font-extrabold text-white">
            Espaces <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">de connaissance</span>
          </h2>
          <p className="text-slate-400 mt-1 text-sm">
            {currentTenant?.tenant.name} — {spaces.length} espace{spaces.length !== 1 ? "s" : ""} configuré{spaces.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Spaces Grid */}
        {loadingSpaces ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : spaces.length === 0 ? (
          <div className="glass-card rounded-3xl flex flex-col items-center justify-center py-24 space-y-4">
            <div className="p-6 rounded-3xl bg-purple-500/5 border border-purple-500/10">
              <BookOpenIcon className="w-12 h-12 text-purple-500/40" />
            </div>
            <p className="text-slate-500 font-medium text-lg">Aucun espace de connaissance</p>
            <p className="text-slate-600 text-sm max-w-md text-center">
              Les espaces permettent d'organiser vos documents par thématique. Créez votre premier espace pour commencer !
            </p>
            {permissions?.can_upload && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 flex items-center space-x-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-purple-500/20"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Créer un espace</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {spaces.map((space) => (
              <div
                key={space.id}
                className="glass-card rounded-2xl p-6 flex flex-col hover:translate-y-[-4px] transition-all duration-300 hover:border-purple-500/30 group cursor-pointer"
                onClick={() => router.push(`/documents?space=${space.id}`)}
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 group-hover:bg-purple-500/20 transition-colors">
                    <FolderIcon className="w-6 h-6 text-purple-400" />
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg border ${
                    space.is_active
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-slate-500/10 text-slate-500 border-slate-600/20"
                  }`}>
                    {space.is_active ? "Actif" : "Inactif"}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-purple-200 transition-colors">{space.name}</h3>
                <p className="text-slate-500 text-xs font-mono bg-slate-800/50 px-2 py-1 rounded-md self-start mb-3">{space.slug}</p>

                {space.description && (
                  <p className="text-slate-400 text-sm line-clamp-2 mb-4 flex-1">{space.description}</p>
                )}

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                  <div className="flex items-center space-x-1.5 text-slate-500 text-xs">
                    <DocumentTextIcon className="w-3.5 h-3.5" />
                    <span>{space.document_count ?? "—"} document{(space.document_count ?? 0) !== 1 ? "s" : ""}</span>
                  </div>
                  <span className="text-xs text-slate-600">
                    {new Date(space.created_at).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Space Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Créer un espace</h3>
              <button
                onClick={() => { setShowCreateModal(false); setCreateError(null); }}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-300 mb-2 block">Nom de l'espace *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) })}
                  placeholder="Ex: Ressources Juridiques"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-300 mb-2 block">Identifiant (slug) *</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
                  placeholder="ressources-juridiques"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
                />
                <p className="text-xs text-slate-500 mt-1">Utilisé dans les URLs, uniquement lettres minuscules, chiffres et tirets.</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-300 mb-2 block">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Description optionnelle de cet espace..."
                  rows={3}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              {createError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                  {createError}
                </div>
              )}

              <button
                onClick={handleCreate}
                disabled={creating || !form.name.trim() || !form.slug.trim()}
                className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-sm shadow-lg shadow-purple-500/20"
              >
                {creating ? "Création en cours..." : "Créer l'espace"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
