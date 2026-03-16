// src/app/(dashboard)/documents/page.tsx
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/lib/api-client";
import { tenantService } from "@/services/tenant.service";
import { TopBar } from "@/components/layout/TopBar";
import type { TenantMembership } from "@/types/tenant.types";
import {
  FileText,
  AlertCircle,
  Loader2,
  Zap,
} from "lucide-react";

interface DocumentData {
  id: string;
  title: string;
  status: string;
  knowledge_space_id: string;
  created_by_email: string | null;
  current_version: {
    file_name: string;
    file_size_bytes: number;
    indexing_status: string;
  } | null;
  created_at: string;
}

type BadgeVariant = "queued" | "processing" | "indexed" | "failed";

const STATUS_CONFIG: Record<BadgeVariant, { label: string; cls: string }> = {
  queued:     { label: "EN ATTENTE",   cls: "bg-amber-500/10  text-amber-400  border border-amber-500/20"   },
  processing: { label: "TRAITEMENT",  cls: "bg-blue-500/10   text-blue-400   border border-blue-500/20"    },
  indexed:    { label: "INDEXÉ",       cls: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"},
  failed:     { label: "ÉCHOUÉ",       cls: "bg-red-500/10    text-red-400    border border-red-500/20"      },
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function DocumentsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  
  const [tenants, setTenants] = useState<TenantMembership[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [spaceId, setSpaceId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/login");
  }, [authLoading, isAuthenticated, router]);

  const loadData = useCallback(async (tid: string) => {
    setLoading(true);
    const [spacesRes, docsRes] = await Promise.all([
      apiClient.get<any[]>(`/tenants/${tid}/spaces/`),
      apiClient.get<DocumentData[]>(`/tenants/${tid}/documents/`),
    ]);
    if (spacesRes.data?.length) setSpaceId(spacesRes.data[0].id);
    if (docsRes.data) setDocuments(docsRes.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      tenantService.myTenants().then((res) => {
        if (res.data?.length) {
          const data = res.data as unknown as TenantMembership[];
          setTenants(data);
          const firstTid = data[0].tenant.id;
          setSelectedTenantId(firstTid);
          loadData(firstTid);
        }
      });
    }
  }, [isAuthenticated, loadData]);

  const handleTenantChange = (tid: string) => {
     setSelectedTenantId(tid);
     loadData(tid);
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTenantId || !spaceId) return;
    setUploading(true);
    setUploadError("");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("knowledge_space_id", spaceId);
    formData.append("title", file.name.replace(/\.pdf$/i, ""));
    const res = await apiClient.uploadFile<DocumentData>(`/tenants/${selectedTenantId}/documents/`, formData);
    if (res.error) {
      setUploadError(res.error.message || "Erreur lors de l'upload.");
    } else if (res.data) {
      setDocuments((prev) => [res.data!, ...prev]);
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-10 h-10 border-[3px] border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-200 antialiased">
      <TopBar 
        userEmail={user?.email}
        isSuperuser={user?.is_superuser}
        tenants={tenants}
        selectedTenantId={selectedTenantId}
        onTenantChange={handleTenantChange}
        onLogout={handleLogout}
        onAdminDashboard={() => router.push("/admin/dashboard")}
      />

      <main className="max-w-7xl mx-auto px-8 md:px-12 py-16 space-y-12">
        {/* Page Header */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
             <div className="flex items-center gap-3 text-indigo-400 font-bold tracking-widest text-[10px] uppercase">
                <FileText className="w-4 h-4" />
                <span>Base documentaire</span>
             </div>
             <h1 className="text-4xl font-extrabold font-heading text-white">Gestion des documents</h1>
             <p className="text-slate-400 text-lg font-medium">Uploadez et gérez vos sources de connaissances.</p>
          </div>

          <label
            className={`group flex items-center gap-3 px-8 py-4 rounded-[18px] font-black tracking-widest text-xs text-white cursor-pointer transition-all shadow-2xl hover:shadow-indigo-500/20 active:scale-95 ${uploading ? "opacity-60 cursor-wait" : ""}`}
            style={{ backgroundImage: "var(--gradient-button)" }}
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Zap className="w-5 h-5 group-hover:scale-110 transition-transform" />
            )}
            <span>{uploading ? "INDEXATION..." : "UPLOADER UN PDF"}</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </section>

        {/* Error Display */}
        {uploadError && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-bold flex items-center gap-3 animate-fade-in">
            <AlertCircle className="w-5 h-5" />
            {uploadError}
          </div>
        )}

        {/* Content Area */}
        {documents.length === 0 ? (
          <div className="bg-[#131722] border border-white/5 rounded-[40px] py-32 text-center backdrop-blur-xl">
            <div className="w-24 h-24 rounded-[32px] bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-8">
              <FileText className="w-12 h-12 text-slate-600" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Aucun document</h3>
            <p className="text-slate-500 max-w-xs mx-auto text-sm">
              Ajoutez vos rapports, contrats ou guides au format PDF pour les rendre accessibles à l'IA.
            </p>
          </div>
        ) : (
          /* Glass Table Stitch-precision */
          <div className="bg-[#131722] border border-white/5 rounded-[32px] overflow-hidden shadow-2xl backdrop-blur-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/[0.03] border-b border-white/5">
                    <th className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Titre</th>
                    <th className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Fichier</th>
                    <th className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-center">Taille</th>
                    <th className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-center">Statut</th>
                    <th className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Uploadé par</th>
                    <th className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {documents.map((doc) => {
                    const badge = STATUS_CONFIG[(doc.status as BadgeVariant)] || STATUS_CONFIG.queued;
                    return (
                      <tr
                        key={doc.id}
                        className="group hover:bg-white/[0.01] transition-colors"
                      >
                        <td className="py-6 px-8 font-bold text-white group-hover:text-indigo-300 transition-colors">
                          {doc.title}
                        </td>
                        <td className="py-6 px-8 text-slate-400 text-xs font-medium">
                          {doc.current_version?.file_name || "—"}
                        </td>
                        <td className="py-6 px-8 text-slate-500 text-xs text-center font-mono">
                          {doc.current_version
                            ? formatFileSize(doc.current_version.file_size_bytes)
                            : "—"}
                        </td>
                        <td className="py-6 px-8 text-center">
                          <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest ${badge.cls}`}>
                             {badge.label}
                          </span>
                        </td>
                        <td className="py-6 px-8 text-slate-500 text-xs font-medium">
                          {doc.created_by_email || "Système"}
                        </td>
                        <td className="py-6 px-8 text-slate-600 text-[10px] font-bold text-right whitespace-nowrap">
                          {formatDate(doc.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <style jsx global>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
}
