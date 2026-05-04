"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { tenantService } from "@/services/tenant.service";
import type { TenantMembership, KnowledgeSpace, Document, TenantPermissions } from "@/types/tenant.types";
import { TopBar } from "@/components/layout/TopBar";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { EmptyDocs } from "@/components/illustrations/EmptyDocs";
import { staggerContainer, fadeUp } from "@/lib/motion";
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
  queued: { label: "EN ATTENTE", icon: Clock, color: "text-warning", bg: "bg-warning/10", border: "border-warning/20" },
  processing: { label: "INDEXATION", icon: Loader2, color: "text-info", bg: "bg-info/10", border: "border-info/20" },
  indexed: { label: "PRÊT", icon: CheckCircle2, color: "text-success", bg: "bg-success/10", border: "border-success/20" },
  failed: { label: "ERREUR", icon: AlertCircle, color: "text-error", bg: "bg-error/10", border: "border-error/20" },
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
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const shouldReduceMotion = useReducedMotion();

  const [tenants, setTenants] = useState<TenantMembership[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [spaces, setSpaces] = useState<KnowledgeSpace[]>([]);
  const [currentSpaceId, setCurrentSpaceId] = useState<string | null>(searchParams.get("space"));
  const [documents, setDocuments] = useState<Document[]>([]);
  const [permissions, setPermissions] = useState<TenantPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

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

  const handleDelete = async (docId: string) => {
    if (!selectedTenant || !currentSpaceId || !confirm("Supprimer ce document ?")) return;
    await tenantService.deleteDocument(selectedTenant, currentSpaceId, docId);
    loadDocs();
    setOpenMenuId(null);
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

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (isLoading || (!isAuthenticated && !isLoading)) return <PageLoader />;

  return (
    <div className="min-h-screen bg-bg-base">
      <TopBar
        userEmail={user?.email}
        isSuperuser={user?.is_superuser}
        tenants={tenants}
        selectedTenantId={selectedTenant}
        onTenantChange={setSelectedTenant}
        onLogout={handleLogout}
        onAdminDashboard={() => router.push("/admin/dashboard")}
      />

      <main id="main" className="mx-auto max-w-6xl px-6 pt-28 pb-16">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={shouldReduceMotion ? {} : staggerContainer}
          className="space-y-8"
        >
          {/* Header */}
          <motion.header
            variants={shouldReduceMotion ? { hidden: { opacity: 0 }, visible: { opacity: 1 } } : fadeUp}
            className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-fg-tertiary">
                Ingestion documentaire
              </p>
              <h1 className="font-serif text-4xl tracking-tight text-fg-primary sm:text-5xl">
                Documents
              </h1>

              {/* Space filter chips */}
              <div className="flex flex-wrap gap-2 pt-1">
                {spaces.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setCurrentSpaceId(s.id)}
                    className={`rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest transition-all ${
                      currentSpaceId === s.id
                        ? "bg-brand-primary text-white shadow-[0_4px_16px_-4px_rgba(99,102,241,0.5)]"
                        : "border border-border-subtle bg-bg-elevated-1 text-fg-tertiary hover:border-border-strong hover:text-fg-secondary"
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            {permissions?.can_upload && (
              <div className="relative shrink-0">
                <input
                  type="file"
                  onChange={handleUpload}
                  disabled={uploading}
                  className="absolute inset-0 cursor-pointer opacity-0 z-10"
                  accept=".pdf,.txt,.docx"
                />
                <button
                  disabled={uploading}
                  className="flex items-center gap-2.5 rounded-2xl border border-brand-primary/30 bg-brand-primary/10 px-5 py-3 text-sm font-semibold text-brand-primary shadow-[0_0_24px_-8px_rgba(99,102,241,0.4)] transition-all hover:bg-brand-primary/20 disabled:opacity-50"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  <span>{uploading ? "Traitement..." : "Uploader un fichier"}</span>
                </button>
              </div>
            )}
          </motion.header>

          {/* Document list */}
          <motion.section
            variants={shouldReduceMotion ? { hidden: { opacity: 0 }, visible: { opacity: 1 } } : fadeUp}
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-4 py-32">
                <div className="h-10 w-10 rounded-full border-2 border-bg-elevated-3 border-t-brand-primary animate-spin" />
                <p className="text-xs font-semibold uppercase tracking-widest text-fg-tertiary">
                  Lecture de la base…
                </p>
              </div>
            ) : documents.length === 0 ? (
              <div className="rounded-[28px] border border-border-subtle bg-bg-elevated-1/60 py-20">
                <EmptyState
                  illustration={<EmptyDocs className="mx-auto" />}
                  title="Zone sans données"
                  description="Cet espace est actuellement vide. Commencez l'indexation pour activer l'IA."
                />
              </div>
            ) : (
              <div className="rounded-[28px] border border-border-subtle bg-bg-elevated-1/60 overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-12 border-b border-border-subtle px-6 py-3 text-[10px] font-semibold uppercase tracking-widest text-fg-tertiary">
                  <div className="col-span-5">Document</div>
                  <div className="col-span-2 text-center">Taille</div>
                  <div className="col-span-2 text-center">État</div>
                  <div className="col-span-2 text-center">Date</div>
                  <div className="col-span-1 text-right">Action</div>
                </div>

                {/* Rows */}
                <AnimatePresence initial={false}>
                  {documents.map((doc, i) => {
                    const ext = doc.current_version?.file_name.split(".").pop()?.toLowerCase() ?? "pdf";
                    const iconSrc = FILE_TYPE_ICONS[ext] ?? "/file-types/txt.svg";
                    const status = STATUS_CONFIG[doc.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.queued;
                    return (
                      <motion.div
                        key={doc.id}
                        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className={`group grid grid-cols-12 items-center px-6 py-4 transition-colors hover:bg-bg-elevated-2/40 ${i < documents.length - 1 ? "border-b border-border-subtle" : ""}`}
                      >
                        <div className="col-span-5 flex items-center gap-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-subtle bg-bg-elevated-2">
                            <Image src={iconSrc} alt={ext} width={22} height={22} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-fg-primary">{doc.title}</p>
                            <p className="font-mono text-[10px] uppercase text-fg-tertiary">
                              {ext}
                            </p>
                          </div>
                        </div>

                        <div className="col-span-2 text-center font-mono text-xs text-fg-secondary tabular-nums">
                          {formatSize(doc.current_version?.file_size_bytes || 0)}
                        </div>

                        <div className="col-span-2 flex justify-center">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest ${status.bg} ${status.border} ${status.color}`}
                          >
                            <status.icon
                              className={`h-3 w-3 ${doc.status === "processing" ? "animate-spin" : ""}`}
                            />
                            {status.label}
                          </span>
                        </div>

                        <div className="col-span-2 text-center font-mono text-xs text-fg-tertiary">
                          {format(new Date(doc.created_at), "dd/MM/yyyy")}
                        </div>

                        <div className="col-span-1 flex justify-end">
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(openMenuId === doc.id ? null : doc.id);
                              }}
                              className="flex h-8 w-8 items-center justify-center rounded-xl border border-transparent text-fg-tertiary opacity-0 transition-all group-hover:border-border-subtle group-hover:bg-bg-elevated-2 group-hover:opacity-100 hover:text-fg-primary focus-visible:opacity-100"
                              aria-label="Actions"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>

                            <AnimatePresence>
                              {openMenuId === doc.id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                  transition={{ duration: 0.15 }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-border-subtle bg-bg-elevated-2 shadow-[0_24px_48px_-16px_rgba(0,0,0,0.8)]"
                                >
                                  <button
                                    onClick={() =>
                                      handleDownload(
                                        doc.id,
                                        doc.current_version?.file_name || "document.pdf"
                                      )
                                    }
                                    className="flex w-full items-center gap-3 px-4 py-3 text-xs font-semibold text-fg-secondary transition-colors hover:bg-bg-elevated-3 hover:text-fg-primary"
                                  >
                                    <Download className="h-3.5 w-3.5 text-brand-primary" />
                                    Télécharger
                                  </button>
                                  {permissions?.can_delete_documents && (
                                    <button
                                      onClick={() => handleDelete(doc.id)}
                                      className="flex w-full items-center gap-3 px-4 py-3 text-xs font-semibold text-error transition-colors hover:bg-error/10"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                      Supprimer
                                    </button>
                                  )}
                                  <button
                                    onClick={() => setOpenMenuId(null)}
                                    className="flex w-full items-center gap-3 border-t border-border-subtle px-4 py-3 text-xs font-semibold text-fg-tertiary transition-colors hover:bg-bg-elevated-3 hover:text-fg-primary"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                    Fermer
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </motion.section>
        </motion.div>
      </main>
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
