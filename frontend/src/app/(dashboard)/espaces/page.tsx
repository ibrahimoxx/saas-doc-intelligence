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
  FolderPlusIcon,
  TagIcon,
  InformationCircleIcon,
  ArrowUpRightIcon,
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
        <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-purple-500/30">
      {/* Dynamic gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[10%] left-[10%] w-[35%] h-[35%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -bottom-[5%] -right-[5%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[100px] animate-pulse" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#020617]/70 backdrop-blur-2xl border-b border-white/[0.05] px-8 py-5">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <button 
              onClick={() => router.push("/dashboard")} 
              className="group flex items-center space-x-2 text-slate-500 hover:text-white transition-all"
            >
              <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-purple-500/50 group-hover:bg-purple-500/10 transition-all">
                <span className="text-xs group-hover:-translate-x-0.5 transition-transform">←</span>
              </div>
              <span className="text-sm font-medium">Dashboard</span>
            </button>
            <div className="h-6 w-px bg-white/10" />
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shadow-inner">
                <BookOpenIcon className="w-5 h-5 text-purple-400" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white">Espaces de connaissance</h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {tenants.length > 1 && (
                <div className="relative group/select">
                    <select
                        value={selectedTenantId || ""}
                        onChange={(e) => setSelectedTenantId(e.target.value)}
                        className="appearance-none bg-white/[0.03] border border-white/[0.08] hover:border-purple-500/30 rounded-2xl px-6 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all cursor-pointer pr-10"
                    >
                        {tenants.map((m) => (
                            <option key={m.tenant.id} value={m.tenant.id} className="bg-[#0f172a]">{m.tenant.name}</option>
                        ))}
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                        <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>
            )}
            {permissions?.can_upload && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-6 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-xl shadow-purple-600/20 hover:shadow-purple-600/40 hover:-translate-y-0.5"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Nouvel espace</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-[1400px] mx-auto px-8 py-12">
        <div className="space-y-10">
          {/* Hero section */}
          <div className="max-w-3xl space-y-3">
            <h2 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl">
              Organisez votre <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">savoir collectif</span>
            </h2>
            <p className="text-slate-400 text-lg font-medium">
              Les espaces permettent de segmenter vos documents et de personnaliser les réponses de l'IA pour chaque département ou projet.
            </p>
          </div>

          {/* Grid section */}
          {loadingSpaces ? (
            <div className="py-32 flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] animate-pulse">Indexation des espaces...</p>
            </div>
          ) : spaces.length === 0 ? (
            <div className="glass-card rounded-[3rem] p-24 text-center space-y-8 max-w-4xl mx-auto shadow-inner bg-white/[0.01]">
              <div className="relative inline-flex mb-4">
                 <div className="absolute -inset-4 blur-3xl bg-purple-500/20 animate-pulse" />
                 <div className="relative w-32 h-32 rounded-[2rem] bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 flex items-center justify-center shadow-2xl">
                    <FolderPlusIcon className="w-16 h-16 text-purple-400/50" />
                 </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-black text-white">Prêt à uploader ?</h3>
                <p className="text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Aucun espace de connaissance actif. Créez-en un pour commencer à importer vos PDF et interroger l'IA.
                </p>
              </div>
              {permissions?.can_upload && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-white text-[#020617] px-8 py-4 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] hover:bg-slate-200 transition-all hover:scale-105 shadow-xl shadow-white/5"
                >
                  Démarrer le premier espace
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
              {spaces.map((space) => (
                <div
                  key={space.id}
                  onClick={() => router.push(`/documents?space=${space.id}`)}
                  className="group relative h-full glass-card rounded-[2.5rem] p-8 flex flex-col hover:border-purple-500/30 hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-500 cursor-pointer overflow-hidden shimmer"
                >
                  {/* Card Background Glow */}
                  <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  
                  <div className="relative flex items-start justify-between mb-8">
                    <div className="relative">
                        <div className="absolute -inset-2 blur-lg bg-white/10 group-hover:bg-purple-500/20 transition-all opacity-0 group-hover:opacity-100" />
                        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-white/10 group-hover:border-purple-500/30 flex items-center justify-center transition-all duration-500">
                          <FolderIcon className="w-8 h-8 text-purple-400 group-hover:scale-110 transition-transform duration-500" />
                        </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                        <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest ${
                            space.is_active 
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                            : "bg-slate-500/10 text-slate-500 border-white/10"
                        }`}>
                            {space.is_active && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                            <span>{space.is_active ? "Prêt" : "Inactif"}</span>
                        </div>
                        <div className="text-[10px] font-bold text-slate-600 bg-white/[0.03] px-2 py-0.5 rounded-md border border-white/5 uppercase tracking-tighter">
                            {space.slug}
                        </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-6 flex-1">
                    <h3 className="text-2xl font-black text-white group-hover:text-purple-300 transition-colors uppercase tracking-tight">{space.name}</h3>
                    {space.description ? (
                        <p className="text-slate-400 text-sm leading-relaxed line-clamp-2 italic font-medium">
                            "{space.description}"
                        </p>
                    ) : (
                        <p className="text-slate-600 text-sm italic">Aucune description fournie.</p>
                    )}
                  </div>

                  <div className="mt-auto pt-6 border-t border-white/[0.05] flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2 text-slate-500 group-hover:text-slate-300 transition-colors">
                            <DocumentTextIcon className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">{space.document_count ?? 0}</span>
                        </div>
                        <div className="h-4 w-px bg-white/5" />
                        <span className="text-[10px] font-bold text-slate-600 uppercase">
                            {new Date(space.created_at).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}
                        </span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/[0.03] border border-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2 transition-all duration-300">
                        <ArrowUpRightIcon className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Space Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-[#020617]/90 backdrop-blur-xl animate-fade-in" onClick={() => !creating && setShowCreateModal(false)} />
          
          <div className="relative w-full max-w-2xl animate-zoom-in">
            <div className="absolute -inset-1 blur-3xl bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-indigo-500/20 opacity-70" />
            
            <div className="relative bg-[#0f172a] border border-white/[0.08] rounded-[2.5rem] p-12 shadow-[0_32px_128px_-12px_rgba(0,0,0,0.8)] overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500" />
                
                <div className="flex items-center justify-between mb-10">
                   <div className="space-y-2">
                       <h3 className="text-3xl font-black text-white tracking-tighter uppercase">Initialiser un Espace</h3>
                       <p className="text-slate-400 font-medium max-w-sm">Définissez une nouvelle base de connaissances pour l'IA.</p>
                   </div>
                   <button 
                    onClick={() => { setShowCreateModal(false); setCreateError(null); }} 
                    disabled={creating}
                    className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center space-x-2">
                            <TagIcon className="w-3 h-3" />
                            <span>Désignation</span>
                        </label>
                        <input
                          type="text"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) })}
                          placeholder="Ex: Département Légal"
                          className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-purple-500/50 rounded-2xl px-6 py-4 text-white text-base focus:outline-none focus:ring-4 focus:ring-purple-500/10 transition-all font-bold placeholder:text-slate-700"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center space-x-2">
                            <FingerPrintIcon className="w-3 h-3" />
                            <span>Identifiant Permanent</span>
                        </label>
                        <input
                          type="text"
                          value={form.slug}
                          onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
                          placeholder="departement-legal"
                          className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-purple-500/50 rounded-2xl px-6 py-4 text-purple-400 text-base focus:outline-none focus:ring-4 focus:ring-purple-500/10 transition-all font-mono font-bold placeholder:text-slate-800"
                        />
                     </div>
                  </div>

                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center space-x-2">
                            <InformationCircleIcon className="w-3 h-3" />
                            <span>Description contextuelle (facultatif)</span>
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Décrivez l'usage de cet espace pour aider l'IA..."
                      rows={3}
                      className="w-full bg-white/[0.02] border border-white/[0.08] focus:border-purple-500/50 rounded-2xl px-6 py-4 text-white text-base focus:outline-none focus:ring-4 focus:ring-purple-500/10 transition-all resize-none font-medium placeholder:text-slate-700"
                    />
                  </div>

                  {createError && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 flex items-center space-x-3 text-red-400 font-bold text-sm animate-shake">
                       <XMarkIcon className="w-5 h-5 flex-shrink-0" />
                       <p>{createError}</p>
                    </div>
                  )}

                  <div className="pt-4">
                    <button
                      onClick={handleCreate}
                      disabled={creating || !form.name.trim() || !form.slug.trim()}
                      className="group relative w-full rounded-2xl overflow-hidden py-5 active:scale-[0.98] transition-all disabled:opacity-40"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 transition-all hover:scale-105" />
                      <div className="relative flex items-center justify-center space-x-3">
                         {creating ? (
                             <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                         ) : (
                             <>
                                <span className="font-black uppercase text-xs tracking-[0.2em] text-white">Confirmer la création</span>
                                <PlusIcon className="w-5 h-5 text-white group-hover:rotate-90 transition-transform duration-500" />
                             </>
                         )}
                      </div>
                    </button>
                  </div>
                </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes zoom-in { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); } 20%, 40%, 60%, 80% { transform: translateX(4px); } }
        .animate-fade-in { animation: fade-in 0.4s ease-out forwards; }
        .animate-zoom-in { animation: zoom-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .animate-shake { animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both; }
      `}</style>
    </div>
  );
}
