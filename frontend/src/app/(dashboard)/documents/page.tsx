"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/lib/api-client";
import {
  ArrowLeft,
  FileText,
  Upload,
  FolderOpen,
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
  queued:     { label: "En attente",   cls: "bg-amber-500/10  text-amber-400  border border-amber-500/30"   },
  processing: { label: "En traitement",cls: "bg-blue-500/10   text-blue-400   border border-blue-500/30"    },
  indexed:    { label: "Indexé",        cls: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"},
  failed:     { label: "Échoué",        cls: "bg-red-500/10   text-red-400    border border-red-500/30"      },
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
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [spaceId, setSpaceId] = useState<string | null>(null);
  const [tenantError, setTenantError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/login");
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) loadTenantAndDocuments();
  }, [isAuthenticated]);

  const loadTenantAndDocuments = async () => {
    const tenantRes = await apiClient.get<any[]>("/tenants/");
    if (!tenantRes.data || tenantRes.data.length === 0) {
      setTenantError(
        "Vous n'êtes membre d'aucune organisation. Connectez-vous avec un compte valide."
      );
      setLoading(false);
      return;
    }
    const tid = tenantRes.data[0].tenant.id;
    setTenantId(tid);
    const spacesRes = await apiClient.get<any[]>(`/tenants/${tid}/spaces/`);
    if (spacesRes.data?.length) setSpaceId(spacesRes.data[0].id);
    const docsRes = await apiClient.get<DocumentData[]>(`/tenants/${tid}/documents/`);
    if (docsRes.data) setDocuments(docsRes.data);
    setLoading(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !tenantId || !spaceId) return;
    setUploading(true);
    setUploadError("");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("knowledge_space_id", spaceId);
    formData.append("title", file.name.replace(/\.pdf$/i, ""));
    const res = await apiClient.uploadFile<DocumentData>(`/tenants/${tenantId}/documents/`, formData);
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
      <div className="min-h-screen bg-[#0f1123] flex items-center justify-center">
        <div className="w-10 h-10 border-[3px] border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  /* Tenant error state */
  if (tenantError) {
    return (
      <div className="min-h-screen bg-[#0f1123] flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Aucune organisation</h2>
          <p className="text-slate-400 text-sm mb-6">{tenantError}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-5 py-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors text-sm font-semibold"
          >
            ← Retour au Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen text-slate-200 antialiased"
      style={{ background: "linear-gradient(135deg, #0f1123 0%, #151833 100%)" }}
    >
      <div className="max-w-[1200px] mx-auto px-8 py-12">
        {/* ── Header ────────────────────── */}
        <header className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#1E213A] hover:bg-[#2A2D4B] border border-slate-600/60 transition-colors"
              aria-label="Retour"
            >
              <ArrowLeft className="w-5 h-5 text-slate-300" />
            </button>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2.5 font-heading">
              <FileText className="w-6 h-6 text-slate-300" />
              Documents
            </h1>
          </div>

          <label
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white cursor-pointer transition-all shadow-lg shadow-indigo-500/20 ${uploading ? "opacity-60 cursor-wait" : "hover:opacity-90"}`}
            style={{ background: "linear-gradient(90deg, #5B42F3 0%, #00D09C 100%)" }}
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            {uploading ? "Upload en cours…" : "Uploader un PDF"}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </header>

        {/* ── Upload Error ──────────────── */}
        {uploadError && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {uploadError}
          </div>
        )}

        {/* ── Table / Empty ─────────────── */}
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
              <FolderOpen className="w-9 h-9 text-slate-500" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Aucun document</h3>
            <p className="text-sm text-slate-500 max-w-xs">
              Uploadez votre premier PDF pour commencer à interroger l&apos;IA.
            </p>
          </div>
        ) : (
          /* Glass table wrapper */
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(0,0,0,0.4))",
              border: "1px solid rgba(255,255,255,0.10)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), inset 0 0 40px rgba(99,102,241,0.05)",
            }}
          >
            <div
              className="rounded-xl overflow-x-auto"
              style={{ background: "rgba(30,35,66,0.4)", backdropFilter: "blur(16px)" }}
            >
              <table className="w-full text-left">
                <thead>
                  <tr
                    className="text-xs font-semibold uppercase tracking-widest text-slate-400"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <th className="py-4 px-6">Titre</th>
                    <th className="py-4 px-6">Fichier</th>
                    <th className="py-4 px-6">Taille</th>
                    <th className="py-4 px-6">Statut</th>
                    <th className="py-4 px-6">Uploadé par</th>
                    <th className="py-4 px-6">Date</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {documents.map((doc) => {
                    const badge = STATUS_CONFIG[(doc.status as BadgeVariant)] || STATUS_CONFIG.queued;
                    return (
                      <tr
                        key={doc.id}
                        className="hover:bg-white/[0.02] transition-colors"
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                      >
                        <td className="py-4 px-6 font-medium text-white max-w-[180px] truncate">
                          {doc.title}
                        </td>
                        <td className="py-4 px-6 text-slate-400 max-w-[160px] truncate">
                          {doc.current_version?.file_name || "—"}
                        </td>
                        <td className="py-4 px-6 text-slate-400">
                          {doc.current_version
                            ? formatFileSize(doc.current_version.file_size_bytes)
                            : "—"}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge.cls}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-slate-400 text-xs">
                          {doc.created_by_email || "—"}
                        </td>
                        <td className="py-4 px-6 text-slate-500 text-xs whitespace-nowrap">
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
      </div>
    </div>
  );
}
