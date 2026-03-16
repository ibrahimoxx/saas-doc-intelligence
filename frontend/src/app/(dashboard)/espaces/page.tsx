// src/app/(dashboard)/espaces/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { tenantService } from "@/services/tenant.service";
import type { TenantMembership, KnowledgeSpace, TenantPermissions } from "@/types/tenant.types";
import { TopBar } from "@/components/layout/TopBar";
import {
  Plus as PlusIcon,
  Folder as FolderIcon,
  X as XMarkIcon,
  FolderPlus as FolderPlusIcon,
  Tag as TagIcon,
  Info as InfoIcon,
  ArrowUpRight as ArrowUpRightIcon,
  Shield as ShieldIcon,
  FileIcon,
  MoreVertical,
  Trash2,
  Edit,
} from "lucide-react";

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
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  const [tenants, setTenants] = useState<TenantMembership[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [spaces, setSpaces] = useState<KnowledgeSpace[]>([]);
  const [permissions, setPermissions] = useState<TenantPermissions | null>(null);
  const [loadingSpaces, setLoadingSpaces] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", description: "" });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

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

      <main className="max-w-[1400px] mx-auto px-12 py-48 space-y-24">
        {/* Section Header */}
        <section className="flex flex-col md:flex-row items-center justify-between gap-12 text-center md:text-left animate-fluid-in">
          <div className="space-y-6 max-w-2xl">
            <h2 className="text-hero leading-tight">
               Espaces de <br />
               <span className="text-gradient">Connaissance</span>
            </h2>
            <p className="text-slate-400 text-lg md:text-xl font-medium leading-relaxed">
              Compartimentez vos données pour une analyse chirurgicale par département ou projet.
            </p>
          </div>
          
          {permissions?.can_upload && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-magnetic flex items-center gap-4 group interactive-premium"
            >
              <PlusIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
              <span>Initialiser un Espace</span>
            </button>
          )}
        </section>

        {/* Dynamic Grid */}
        {loadingSpaces ? (
          <div className="py-48 flex flex-col items-center justify-center gap-6 animate-fluid-in">
             <div className="w-16 h-16 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin" />
             <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 animate-pulse">Synchronisation...</p>
          </div>
        ) : spaces.length === 0 ? (
          <div className="fluid-card max-w-3xl mx-auto text-center space-y-12 animate-fluid-in">
              <div className="w-32 h-32 rounded-[40px] bg-indigo-500/5 flex items-center justify-center mx-auto shadow-2xl">
                 <FolderPlusIcon className="w-16 h-16 text-indigo-400" />
              </div>
              <div className="space-y-4">
                 <h3 className="text-4xl font-black tracking-tighter text-white uppercase text-gradient">Prêt à uploader ?</h3>
                 <p className="text-slate-400 text-lg font-medium max-w-md mx-auto">
                    Créez votre premier espace de travail pour indexer vos documents PDF.
                 </p>
              </div>
              {permissions?.can_upload && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-magnetic interactive-premium"
                >
                  Démarrer l'aventure
                </button>
              )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 animate-fluid-in">
            {spaces.map((space, i) => (
              <div
                key={space.id}
                onClick={() => router.push(`/documents?space=${space.id}`)}
                className={`fluid-card group relative cursor-pointer ${openMenuId === space.id ? 'z-top-layer overflow-visible' : ''}`}
                style={{ animationDelay: `${(i+1)*100}ms` }}
              >
                <div className="flex flex-col gap-10">
                  <div className="flex items-start justify-between">
                    <div className="w-20 h-20 rounded-[28px] bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/20 transition-all duration-700">
                      <FolderIcon className="w-10 h-10 text-indigo-400" />
                    </div>
                    
                    <div className="flex items-center gap-4">
                       <div className={`px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest uppercase border ${
                         space.is_active 
                         ? "bg-emerald-500/5 text-emerald-400 border-emerald-500/10" 
                         : "bg-slate-500/5 text-slate-500 border-white/5"
                       }`}>
                         {space.is_active ? "PRÊT" : "OFFLINE"}
                       </div>

                       <div className="relative">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === space.id ? null : space.id);
                            }}
                            className={`glass-trigger ${openMenuId === space.id ? 'glass-trigger-active' : ''}`}
                          >
                             <MoreVertical className="w-4 h-4" />
                          </button>

                          {openMenuId === space.id && (
                            <div 
                              className="absolute right-0 top-full mt-2 w-56 bg-[#0f172a] border border-white/10 rounded-[32px] p-4 shadow-2xl z-50 animate-fluid-in backdrop-blur-3xl"
                              onClick={(e) => e.stopPropagation()}
                            >
                               <div className="space-y-2">
                                  <p className="px-2 pb-2 text-[8px] font-black uppercase tracking-widest text-slate-600 border-b border-white/5 mb-1 text-center">Options Espace</p>
                                  
                                  <button 
                                    onClick={() => router.push(`/documents?space=${space.id}`)}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-white/5 text-slate-300 hover:text-white transition-all duration-500 text-[9px] font-black uppercase tracking-widest text-left hover:scale-[1.02]"
                                  >
                                     <ArrowUpRightIcon className="w-4 h-4 text-indigo-400" />
                                     <span>Ouvrir</span>
                                  </button>

                                  {(permissions?.role === 'admin' || permissions?.role === 'owner') && (
                                    <button 
                                      onClick={() => handleDeleteSpace(space.id)}
                                      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-red-500/5 text-red-400 hover:text-red-300 transition-all duration-500 text-[9px] font-black uppercase tracking-widest text-left hover:scale-[1.02]"
                                    >
                                       <Trash2 className="w-4 h-4" />
                                       <span>Supprimer</span>
                                    </button>
                                  )}
                               </div>
                            </div>
                          )}
                       </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-3xl font-black tracking-tighter text-white group-hover:text-indigo-400 transition-colors">
                      {space.name}
                    </h3>
                    <p className="text-slate-500 text-sm font-medium line-clamp-2 leading-relaxed">
                      {space.description || "Aucune description analytique fournie."}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-8 border-t border-white/5 uppercase text-[10px] font-black tracking-widest text-slate-500">
                    <div className="flex items-center gap-2">
                       <FileIcon className="w-4 h-4 text-indigo-500/30" />
                       <span>{space.document_count ?? 0} Documents</span>
                    </div>
                    <div className="w-12 h-12 rounded-full border border-white/5 flex items-center justify-center group-hover:bg-white group-hover:text-indigo-950 transition-all duration-500">
                       <ArrowUpRightIcon className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modern Modal Overhaul */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[#020617]/95 backdrop-blur-3xl" onClick={() => !creating && setShowCreateModal(false)} />
          
          <div className="relative w-full max-w-2xl bg-white/[0.02] border border-white/10 rounded-[64px] p-16 overflow-hidden shadow-2xl animate-fluid-in">
            <header className="flex justify-between items-start mb-12">
              <div className="space-y-4">
                <h3 className="text-4xl font-black tracking-tighter text-white uppercase text-gradient">Initialisation</h3>
                <p className="text-slate-400 font-medium">Configurez les paramètres de l'espace.</p>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="w-14 h-14 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all interactive-premium shadow-xl"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </header>

            <div className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2 flex items-center gap-2">
                    <TagIcon className="w-3 h-3" />
                    <span>Identité</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) })}
                    placeholder="Ventes France..."
                    className="w-full bg-white/5 border border-white/5 rounded-[24px] px-8 py-5 font-bold text-white focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-700"
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2 flex items-center gap-2">
                    <ShieldIcon className="w-3 h-3" />
                    <span>Unique Slug</span>
                  </label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
                    placeholder="ventes-fr"
                    className="w-full bg-white/5 border border-white/5 rounded-[24px] px-8 py-5 font-mono font-bold text-indigo-400 focus:outline-none focus:border-indigo-500/50 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2 flex items-center gap-2">
                  <InfoIcon className="w-3 h-3" />
                  <span>Metadata</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Décrivez l'usage de cet espace..."
                  rows={4}
                  className="w-full bg-white/5 border border-white/5 rounded-[32px] px-8 py-6 text-white resize-none focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-700 font-medium"
                />
              </div>

              {createError && (
                <div className="p-5 bg-red-500/5 border border-red-500/10 rounded-[28px] text-red-400 text-sm font-bold animate-pulse">
                  {createError}
                </div>
              )}

              <button
                onClick={handleCreate}
                disabled={creating || !form.name.trim() || !form.slug.trim()}
                className="btn-magnetic w-full py-6 text-xs interactive-premium"
              >
                {creating ? "Phase d'Initialisation..." : "Confirmer l'Initialisation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
