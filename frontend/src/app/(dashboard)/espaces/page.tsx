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
  FileText as FileIcon,
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
    <div className="min-h-screen text-white antialiased">
      <TopBar
        userEmail={user?.email}
        isSuperuser={user?.is_superuser}
        tenants={tenants}
        selectedTenantId={selectedTenantId}
        onTenantChange={(id) => setSelectedTenantId(id)}
        onLogout={handleLogout}
        onAdminDashboard={() => router.push("/admin/dashboard")}
      />

      <main className="max-w-7xl mx-auto px-8 md:px-12 py-16 space-y-16 relative z-10">
        {/* Hero Section */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <h2 className="text-5xl font-extrabold tracking-tight font-heading leading-tight">
              Organisez votre <br />
              <span className="text-gradient">savoir collectif</span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              Les espaces permettent de segmenter vos documents et de personnaliser les réponses de l'IA pour chaque département ou projet.
            </p>
          </div>
          
          {permissions?.can_upload && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="group flex items-center gap-3 px-8 py-4 rounded-[18px] text-white font-bold transition-all shadow-xl hover:shadow-indigo-500/20 active:scale-95 bg-gradient-brand"
            >
              <PlusIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              <span>Nouvel espace</span>
            </button>
          )}
        </section>

        {/* Spaces Grid */}
        {loadingSpaces ? (
          <div className="py-32 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs animate-pulse">Indexation des espaces...</p>
          </div>
        ) : spaces.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-[40px] p-24 text-center max-w-4xl mx-auto backdrop-blur-xl">
             <div className="w-24 h-24 rounded-[32px] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-8 shadow-2xl">
                <FolderPlusIcon className="w-12 h-12 text-indigo-400" />
             </div>
             <h3 className="text-3xl font-bold mb-4">Prêt à uploader ?</h3>
             <p className="text-slate-400 text-lg mb-10 max-w-md mx-auto line-clamp-2">
                Aucun espace de connaissance actif. Créez-en un pour commencer à importer vos PDF et interroger l'IA.
             </p>
             {permissions?.can_upload && (
               <button
                 onClick={() => setShowCreateModal(true)}
                 className="bg-white text-indigo-950 px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all hover:scale-105"
               >
                 Démarrer le premier espace
               </button>
             )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {spaces.map((space) => (
              <div
                key={space.id}
                onClick={() => router.push(`/documents?space=${space.id}`)}
                className="group relative bg-[#131722] border border-white/5 rounded-[40px] p-10 cursor-pointer overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:border-white/10"
              >
                {/* Visual Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative z-10 space-y-10">
                  {/* Icon Area */}
                  <div className="flex items-start justify-between">
                    <div className="w-20 h-20 rounded-[28px] bg-gradient-folder flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-500">
                      <FolderIcon className="w-10 h-10 text-white" />
                    </div>
                    <div className={`px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border ${
                      space.is_active 
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                      : "bg-slate-500/10 text-slate-500 border-white/10"
                    }`}>
                      {space.is_active ? "PRÊT" : "INACTIF"}
                    </div>
                  </div>

                  {/* Text Content */}
                  <div className="space-y-3">
                    <h3 className="text-3xl font-bold font-heading tracking-tight leading-none group-hover:text-indigo-400 transition-colors">
                      {space.name}
                    </h3>
                    <p className="text-slate-500 text-sm font-medium line-clamp-2 leading-relaxed italic">
                      {space.description || "Aucune description fournie pour cet espace."}
                    </p>
                  </div>

                  {/* Metadata Footer */}
                  <div className="flex items-center justify-between pt-8 border-t border-white/5 uppercase text-[10px] font-black tracking-widest text-slate-500">
                    <div className="flex items-center gap-2">
                       <FileIcon className="w-4 h-4 text-indigo-400/50" />
                       <span>{space.document_count ?? 0} Documents</span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-4 transition-all duration-300">
                       <ArrowUpRightIcon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[#020617]/95 backdrop-blur-xl animate-fade-in" onClick={() => !creating && setShowCreateModal(false)} />
          
          <div className="relative w-full max-w-2xl bg-[#0f172a] border border-white/10 rounded-[40px] p-12 overflow-hidden shadow-2xl animate-fade-in-up">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-brand" />
            
            <header className="flex justify-between items-start mb-10">
              <div className="space-y-2">
                <h3 className="text-3xl font-bold font-heading uppercase tracking-tight text-white">Initialiser un Espace</h3>
                <p className="text-slate-400 font-medium">Configurez votre base de connaissances.</p>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </header>

            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <TagIcon className="w-3 h-3" />
                    <span>NOM DE L'ESPACE</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) })}
                    placeholder="Espace de Vente..."
                    className="w-full bg-[#131722] border border-white/5 rounded-2xl px-6 py-4 font-bold text-white focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-700"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <ShieldIcon className="w-3 h-3" />
                    <span>ID PERMANENT</span>
                  </label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
                    placeholder="espace-vente"
                    className="w-full bg-[#131722] border border-white/5 rounded-2xl px-6 py-4 font-mono font-bold text-indigo-400 focus:outline-none focus:border-indigo-500/50 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <InfoIcon className="w-3 h-3" />
                  <span>DESCRIPTION</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Décrivez cet espace..."
                  rows={4}
                  className="w-full bg-[#131722] border border-white/5 rounded-2xl px-6 py-4 text-white resize-none focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-700 font-medium"
                />
              </div>

              {createError && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-bold flex items-center gap-3">
                  <XMarkIcon className="w-5 h-5" />
                  {createError}
                </div>
              )}

              <button
                onClick={handleCreate}
                disabled={creating || !form.name.trim() || !form.slug.trim()}
                className="w-full bg-gradient-brand text-white font-black uppercase text-xs tracking-widest py-5 rounded-[20px] shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 active:scale-95 transition-all disabled:opacity-50"
              >
                {creating ? "Initialisation..." : "Confirmer la création"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
}
