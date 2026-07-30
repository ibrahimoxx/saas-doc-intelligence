"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useTenants } from "@/hooks/useTenants";
import { tenantService } from "@/services/tenant.service";
import type { KnowledgeSpace, Document, TenantPermissions } from "@/types/tenant.types";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { EmptyDocs } from "@/components/illustrations/EmptyDocs";
import {
  FileText,
  Upload,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreVertical,
  Trash2,
  Download,
  X,
} from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";

const STATUS_CONFIG = {
  queued: { label: "En attente", icon: Clock, color: "text-warning", bg: "bg-warning-bg", border: "border-warning-border" },
  processing: { label: "Indexation", icon: Loader2, color: "text-info", bg: "bg-info-bg", border: "border-info-border" },
  indexed: { label: "Indexé", icon: CheckCircle2, color: "text-success", bg: "bg-success-bg", border: "border-success-border" },
  failed: { label: "Erreur", icon: AlertCircle, color: "text-error", bg: "bg-error-bg", border: "border-error-border" },
};

const FILE_TYPE_ICONS: Record<string, string> = {
  pdf: "/file-types/pdf.svg",
  docx: "/file-types/docx.svg",
  doc: "/file-types/docx.svg",
  xlsx: "/file-types/xlsx.svg",
  xls: "/file-types/xlsx.svg",
  pptx: "/file-types/pptx.svg",
  ppt: "/file-types/pptx.svg",
  txt: "/file-types/txt.svg",
  md: "/file-types/md.svg",
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
  const { isAuthenticated, isLoading } = useAuth();

  const { selectedTenantId: selectedTenant } = useTenants();
  const [spaces, setSpaces] = useState<KnowledgeSpace[]>([]);
  const [currentSpaceId, setCurrentSpaceId] = useState<string | null>(searchParams.get("space"));
  const [documents, setDocuments] = useState<Document[]>([]);
  const [permissions, setPermissions] = useState<TenantPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isLoading, isAuthenticated, router]);

  const loadData = useCallback(async (tid: string) => {
    const [spacesRes, permsRes] = await Promise.all([
      tenantService.knowledgeSpaces(tid),
      tenantService.myPermissions(tid),
    ]);
    if (spacesRes.data) {
      setSpaces(spacesRes.data);
      if (!currentSpaceId && spacesRes.data.length) {
        setCurrentSpaceId(spacesRes.data[0].id);
      } else if (!spacesRes.data.length) {
        setLoading(false);
      }
    }
    if (permsRes.data) setPermissions(permsRes.data);
  }, [currentSpaceId]);

  useEffect(() => {
    if (selectedTenant) loadData(selectedTenant);
  }, [selectedTenant, loadData]);

  const loadDocs = async () => {
    if (!selectedTenant || !currentSpaceId) return;
    setLoading(true);
    const res = await tenantService.listDocuments(selectedTenant, currentSpaceId);
    if (res.data) setDocuments(res.data);
    setLoading(false);
  };

  const silentRefresh = useCallback(async (tid: string, spaceId: string) => {
    const res = await tenantService.listDocuments(tid, spaceId);
    if (res.data) setDocuments(res.data);
  }, []);

  useEffect(() => {
    if (selectedTenant && currentSpaceId) loadDocs();
  }, [selectedTenant, currentSpaceId]);

  // Poll every 3s while any doc is processing/queued
  useEffect(() => {
    const hasPending = documents.some((d) => d.status === "processing" || d.status === "queued");
    if (!hasPending || !selectedTenant || !currentSpaceId) return;
    const id = setInterval(() => silentRefresh(selectedTenant, currentSpaceId), 3000);
    return () => clearInterval(id);
  }, [documents, selectedTenant, currentSpaceId, silentRefresh]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTenant || !currentSpaceId) return;
    setUploading(true);
    await tenantService.uploadDocument(selectedTenant, currentSpaceId, file);
    await loadDocs();
    setUploading(false);
  };

  const handleDelete = (docId: string, docTitle: string) => {
    setDeleteTarget({ id: docId, title: docTitle });
    setOpenMenuId(null);
  };

  const confirmDelete = async () => {
    if (!selectedTenant || !currentSpaceId || !deleteTarget) return;
    await tenantService.deleteDocument(selectedTenant, currentSpaceId, deleteTarget.id);
    setDeleteTarget(null);
    loadDocs();
  };

  const handleDownload = async (docId: string, fileName: string) => {
    const token = localStorage.getItem("access_token");
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    const res = await fetch(`${apiBase}/tenants/${selectedTenant}/documents/${docId}/download/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await res.json();
      if (data.download_url) window.open(data.download_url, "_blank");
    } else {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName || "document.pdf";
      a.click();
      URL.revokeObjectURL(url);
    }
    setOpenMenuId(null);
  };

  useEffect(() => {
    const onClick = () => setOpenMenuId(null);
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  if (isLoading || (!isAuthenticated && !isLoading)) return <PageLoader />;

  const currentSpace = spaces.find((s) => s.id === currentSpaceId);

  return (
    <div className="px-8 pb-12 pt-7">
      {/* Header */}
      <div className="mb-[18px] flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="text-[22px] font-bold text-fg-primary">Documents</h1>
          <p className="mt-1 text-[13px] text-fg-secondary">
            {documents.length} document{documents.length === 1 ? "" : "s"}
            {currentSpace && (
              <>
                {" dans l'espace "}
                <strong className="font-semibold text-fg-primary">{currentSpace.name}</strong>
              </>
            )}
          </p>
        </div>

        {permissions?.can_upload && (
          <div className="relative shrink-0">
            <input
              type="file"
              onChange={handleUpload}
              disabled={uploading}
              className="absolute inset-0 z-10 cursor-pointer opacity-0"
              accept=".pdf,.txt,.docx"
              aria-label="Importer un document"
            />
            <button disabled={uploading} className="dc-btn-primary">
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              <span>{uploading ? "Traitement…" : "Importer des documents"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Space filter chips */}
      {spaces.length > 0 && (
        <div className="mb-3.5 flex flex-wrap gap-1.5">
          {spaces.map((s) => (
            <button
              key={s.id}
              onClick={() => setCurrentSpaceId(s.id)}
              className={`rounded-md border px-2.5 py-1.5 text-[12px] font-semibold transition-colors ${
                currentSpaceId === s.id
                  ? "border-brand-primary bg-brand-soft text-brand-primary"
                  : "border-border-subtle bg-bg-elevated-2 text-fg-secondary hover:border-border-strong hover:text-fg-primary"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      {/* Document table */}
      {loading ? (
        <div className="dc-card flex flex-col items-center justify-center gap-3 py-24">
          <Loader2 className="h-5 w-5 animate-spin text-brand-primary" />
          <p className="text-[12px] text-fg-tertiary">Lecture de la base…</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="dc-card py-16">
          <EmptyState
            illustration={<EmptyDocs className="mx-auto" />}
            title="Aucun document"
            description="Cet espace est vide. Importez un fichier pour lancer l'indexation."
          />
        </div>
      ) : (
        <div className="dc-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse">
              <thead>
                <tr>
                  <th className="dc-th text-left">Document</th>
                  <th className="dc-th text-left">Type</th>
                  <th className="dc-th text-left">Statut</th>
                  <th className="dc-th text-right">Taille</th>
                  <th className="dc-th text-right">Ajouté le</th>
                  <th className="dc-th w-12 text-right" />
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => {
                  const ext = doc.current_version?.file_name.split(".").pop()?.toLowerCase() ?? "pdf";
                  const iconSrc = FILE_TYPE_ICONS[ext] ?? "/file-types/txt.svg";
                  const status = STATUS_CONFIG[doc.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.queued;
                  return (
                    <tr key={doc.id} className="dc-row group">
                      <td className="dc-td font-medium text-fg-primary">
                        <div className="flex items-center gap-2">
                          <Image src={iconSrc} alt={ext} width={15} height={15} className="shrink-0" />
                          <span className="truncate">{doc.title}</span>
                        </div>
                      </td>
                      <td className="dc-td font-mono text-[11.5px] uppercase">{ext}</td>
                      <td className="dc-td">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-[5px] border px-2 py-0.5 text-[11px] font-semibold ${status.bg} ${status.border} ${status.color}`}
                        >
                          <status.icon
                            className={`h-3 w-3 ${doc.status === "processing" ? "animate-spin" : ""}`}
                          />
                          {status.label}
                        </span>
                      </td>
                      <td className="dc-td text-right font-mono text-[11.5px] tabular-nums">
                        {formatSize(doc.current_version?.file_size_bytes || 0)}
                      </td>
                      <td className="dc-td text-right text-[12px] text-fg-tertiary">
                        {format(new Date(doc.created_at), "dd/MM/yyyy")}
                      </td>
                      <td className="dc-td text-right">
                        <div className="relative inline-block">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === doc.id ? null : doc.id);
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-fg-tertiary transition-colors hover:border-border-subtle hover:bg-bg-elevated-1 hover:text-fg-primary"
                            aria-label="Actions"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>

                          <AnimatePresence>
                            {openMenuId === doc.id && (
                              <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.12 }}
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-full z-50 mt-1.5 w-44 overflow-hidden rounded-lg border border-border-subtle bg-bg-elevated-2 text-left shadow-card-lift"
                              >
                                <button
                                  onClick={() =>
                                    handleDownload(
                                      doc.id,
                                      doc.current_version?.file_name || "document.pdf"
                                    )
                                  }
                                  className="flex w-full items-center gap-2.5 px-3 py-2.5 text-[12px] font-semibold text-fg-secondary transition-colors hover:bg-bg-elevated-1 hover:text-fg-primary"
                                >
                                  <Download className="h-3.5 w-3.5 text-brand-primary" />
                                  Télécharger
                                </button>
                                {permissions?.can_delete_documents && (
                                  <button
                                    onClick={() => handleDelete(doc.id, doc.title)}
                                    className="flex w-full items-center gap-2.5 border-t border-border-subtle px-3 py-2.5 text-[12px] font-semibold text-error transition-colors hover:bg-error-bg"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Supprimer
                                  </button>
                                )}
                                <button
                                  onClick={() => setOpenMenuId(null)}
                                  className="flex w-full items-center gap-2.5 border-t border-border-subtle px-3 py-2.5 text-[12px] font-semibold text-fg-tertiary transition-colors hover:bg-bg-elevated-1 hover:text-fg-primary"
                                >
                                  <X className="h-3.5 w-3.5" />
                                  Fermer
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} width="max-w-sm">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-error-border bg-error-bg">
              <Trash2 className="h-4 w-4 text-error" />
            </div>
            <div className="min-w-0">
              <p className="text-[13.5px] font-semibold text-fg-primary">Supprimer le document</p>
              <p className="mt-0.5 line-clamp-2 text-[12px] text-fg-tertiary">
                {deleteTarget?.title}
              </p>
            </div>
          </div>
          <p className="text-[13px] leading-relaxed text-fg-secondary">
            Ce document sera supprimé définitivement ainsi que tous ses chunks indexés. Cette action
            est irréversible.
          </p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setDeleteTarget(null)} className="dc-btn">
              Annuler
            </button>
            <button
              onClick={confirmDelete}
              className="rounded-md border border-error-border bg-error-bg px-3.5 py-2 text-[12.5px] font-semibold text-error transition-colors hover:brightness-95"
            >
              Supprimer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <DocumentsContent />
    </Suspense>
  );
}
