// src/app/(dashboard)/documents/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { tenantService } from "@/services/tenant.service";
import type { TenantMembership, KnowledgeSpace, Document } from "@/types/tenant.types";
import { TopBar } from "@/components/layout/TopBar";
import {
  FileText,
  Upload,
  Search,
  Plus,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileIcon,
} from "lucide-react";
import { format } from "date-fns";

const STATUS_CONFIG = {
  pending: { label: "EN ATTENTE", icon: Clock, color: "text-amber-400", bg: "bg-amber-500/5", border: "border-amber-500/10" },
  processing: { label: "INDEXATION", icon: Loader2, color: "text-blue-400", bg: "bg-blue-500/5", border: "border-blue-500/10" },
  completed: { label: "PRÊT", icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/5", border: "border-emerald-500/10" },
  failed: { label: "ERREUR", icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/5", border: "border-red-500/10" },
};

function formatSize(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function DocumentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  const [tenants, setTenants] = useState<TenantMembership[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [spaces, setSpaces] = useState<KnowledgeSpace[]>([]);
  const [currentSpaceId, setCurrentSpaceId] = useState<string | null>(searchParams.get("space"));
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      tenantService.myTenants().then((res) => {
        if (res.data?.length) {
          const memberships = res.data as unknown as TenantMembership[];
          setTenants(memberships);
          setSelectedTenant(memberships[0].tenant.id);
        }
      });
    }
  }, [isAuthenticated]);

  const loadData = async (tid: string) => {
    const res = await tenantService.knowledgeSpaces(tid);
    if (res.data) {
      setSpaces(res.data);
      if (!currentSpaceId && res.data.length) setCurrentSpaceId(res.data[0].id);
    }
  };

  useEffect(() => {
    if (selectedTenant) loadData(selectedTenant);
  }, [selectedTenant]);

  const loadDocs = async () => {
    if (!selectedTenant || !currentSpaceId) return;
    setLoading(true);
    const res = await tenantService.listDocuments(selectedTenant, currentSpaceId);
    if (res.data) setDocuments(res.data);
    setLoading(false);
  };

  useEffect(() => {
    if (selectedTenant && currentSpaceId) loadDocs();
  }, [selectedTenant, currentSpaceId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTenant || !currentSpaceId) return;
    setUploading(true);
    await tenantService.uploadDocument(selectedTenant, currentSpaceId, file);
    await loadDocs();
    setUploading(false);
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
    <div className="min-h-screen">
      <TopBar
        userEmail={user?.email}
        isSuperuser={user?.is_superuser}
        tenants={tenants}
        selectedTenantId={selectedTenant}
        onTenantChange={setSelectedTenant}
        onLogout={handleLogout}
        onAdminDashboard={() => router.push("/admin/dashboard")}
      />

      <main className="max-w-[1400px] mx-auto px-10 py-48 space-y-24">
        {/* Spacious Header */}
        <header className="flex flex-col lg:flex-row items-center justify-between gap-12 animate-fluid-in">
          <div className="text-center lg:text-left space-y-6 max-w-2xl">
            <h2 className="text-hero">
               Ingestion <br />
               <span className="text-gradient">Documentaire</span>
            </h2>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
               {spaces.map(s => (
                 <button
                   key={s.id}
                   onClick={() => setCurrentSpaceId(s.id)}
                   className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                     currentSpaceId === s.id 
                     ? "bg-white text-indigo-950 shadow-2xl" 
                     : "bg-white/5 text-slate-500 border border-white/5 hover:bg-white/10"
                   }`}
                 >
                   {s.name}
                 </button>
               ))}
            </div>
          </div>

          <div className="relative group animate-fluid-in" style={{ animationDelay: '200ms' }}>
             <input
               type="file"
               onChange={handleUpload}
               disabled={uploading}
               className="absolute inset-0 opacity-0 cursor-pointer z-10"
               accept=".pdf,.txt,.docx"
             />
             <div className={`btn-magnetic flex items-center gap-4 px-12 py-6 min-w-[280px] justify-center ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
                {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                <span>{uploading ? "TRAITEMENT..." : "Uploader un Fichier"}</span>
             </div>
          </div>
        </header>

        {/* Spacious Data View */}
        <section className="animate-fluid-in" style={{ animationDelay: '400ms' }}>
          {loading ? (
             <div className="py-48 flex flex-col items-center justify-center gap-8">
               <div className="w-16 h-16 border-4 border-white/5 border-t-indigo-500 rounded-full animate-spin" />
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600">Lecture de la base...</p>
             </div>
          ) : documents.length === 0 ? (
             <div className="fluid-card text-center py-40 space-y-12">
                <div className="w-32 h-32 rounded-[48px] bg-white/5 flex items-center justify-center mx-auto">
                   <FileIcon className="w-16 h-16 text-slate-600" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-3xl font-black tracking-tighter text-white">Zone Sans Données</h3>
                  <p className="text-slate-500 text-lg font-medium max-w-sm mx-auto leading-relaxed">
                    Cet espace est actuellement vide. Commencez l'indexation pour activer l'IA.
                  </p>
                </div>
             </div>
          ) : (
            <div className="space-y-6">
               <div className="grid grid-cols-12 px-10 text-[9px] font-black uppercase tracking-[0.4em] text-slate-600 mb-4">
                  <div className="col-span-6">Document</div>
                  <div className="col-span-2 text-center">Taille</div>
                  <div className="col-span-2 text-center">État</div>
                  <div className="col-span-2 text-right">Date</div>
               </div>
               
               <div className="space-y-4">
                  {documents.map((doc, i) => {
                    const status = STATUS_CONFIG[doc.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
                    return (
                      <div 
                        key={doc.id}
                        className="fluid-card grid grid-cols-12 items-center py-8 hover:-translate-x-1 group"
                        style={{ animationDelay: `${(i+1)*50}ms`, padding: '1.5rem 2.5rem' }}
                      >
                        <div className="col-span-6 flex items-center gap-6">
                           <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-indigo-500/10 group-hover:border-indigo-500/20 transition-all">
                              <FileText className="w-6 h-6 text-indigo-400" />
                           </div>
                           <div className="min-w-0">
                              <p className="text-lg font-black tracking-tight text-white line-clamp-1">{doc.title}</p>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                {doc.current_version?.file_name.split('.').pop() || "PDF"}
                              </p>
                           </div>
                        </div>

                        <div className="col-span-2 text-center font-bold text-slate-400 tabular-nums">
                           {formatSize(doc.current_version?.file_size_bytes || 0)}
                        </div>

                        <div className="col-span-2 flex justify-center">
                           <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border ${status.bg} ${status.border} ${status.color} text-[9px] font-black uppercase tracking-widest`}>
                              <status.icon className={`w-3 h-3 ${doc.status === 'processing' ? 'animate-spin' : ''}`} />
                              <span>{status.label}</span>
                           </div>
                        </div>

                        <div className="col-span-2 text-right font-bold text-slate-500 tabular-nums text-xs">
                           {format(new Date(doc.created_at), "dd/MM/yyyy")}
                        </div>
                      </div>
                    );
                  })}
               </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DocumentsContent />
    </Suspense>
  );
}
