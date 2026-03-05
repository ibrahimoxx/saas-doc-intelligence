"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/lib/api-client";

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

const STATUS_BADGES: Record<string, { label: string; color: string; bg: string }> = {
  queued: { label: "En attente", color: "#fbbf24", bg: "rgba(251, 191, 36, 0.1)" },
  processing: { label: "En traitement", color: "#60a5fa", bg: "rgba(96, 165, 250, 0.1)" },
  indexed: { label: "Indexé", color: "#34d399", bg: "rgba(52, 211, 153, 0.1)" },
  failed: { label: "Échoué", color: "#f87171", bg: "rgba(248, 113, 113, 0.1)" },
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
    hour: "2-digit",
    minute: "2-digit",
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadTenantAndDocuments();
    }
  }, [isAuthenticated]);

  const loadTenantAndDocuments = async () => {
    // Get first tenant
    const tenantRes = await apiClient.get<any[]>("/tenants/");
    if (tenantRes.data && tenantRes.data.length > 0) {
      const tid = tenantRes.data[0].tenant.id;
      setTenantId(tid);

      // Get first space
      const spacesRes = await apiClient.get<any[]>(`/tenants/${tid}/spaces/`);
      if (spacesRes.data && spacesRes.data.length > 0) {
        setSpaceId(spacesRes.data[0].id);
      }

      // Load documents
      const docsRes = await apiClient.get<DocumentData[]>(`/tenants/${tid}/documents/`);
      if (docsRes.data) {
        setDocuments(docsRes.data);
      }
    }
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
      <div className="loading-screen">
        <div className="loader" />
        <style jsx>{`
          .loading-screen { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #0f172a; }
          .loader { width: 40px; height: 40px; border: 3px solid rgba(99,102,241,0.2); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <div className="documents-page">
      <header className="page-header">
        <div className="header-left">
          <button onClick={() => router.push("/dashboard")} className="back-btn">← Dashboard</button>
          <h1>📄 Documents</h1>
        </div>
        <div className="header-right">
          <label className="upload-btn">
            {uploading ? "Upload en cours..." : "📤 Uploader un PDF"}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleUpload}
              disabled={uploading}
              style={{ display: "none" }}
            />
          </label>
        </div>
      </header>

      {uploadError && (
        <div className="upload-error">⚠️ {uploadError}</div>
      )}

      {documents.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📁</div>
          <h2>Aucun document</h2>
          <p>Uploadez votre premier PDF pour commencer.</p>
        </div>
      ) : (
        <div className="documents-table-wrapper">
          <table className="documents-table">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Fichier</th>
                <th>Taille</th>
                <th>Statut</th>
                <th>Uploadé par</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => {
                const badge = STATUS_BADGES[doc.status] || STATUS_BADGES.queued;
                return (
                  <tr key={doc.id}>
                    <td className="doc-title">{doc.title}</td>
                    <td className="doc-file">{doc.current_version?.file_name || "—"}</td>
                    <td>{doc.current_version ? formatFileSize(doc.current_version.file_size_bytes) : "—"}</td>
                    <td>
                      <span className="status-badge" style={{ color: badge.color, background: badge.bg }}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="doc-email">{doc.created_by_email || "—"}</td>
                    <td className="doc-date">{formatDate(doc.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <style jsx>{`
        .documents-page { min-height: 100vh; background: #0f172a; color: #e2e8f0; padding: 2rem; }
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; max-width: 1100px; margin-left: auto; margin-right: auto; }
        .header-left { display: flex; align-items: center; gap: 1rem; }
        .header-left h1 { font-size: 1.5rem; font-weight: 700; }
        .back-btn { background: transparent; border: 1px solid rgba(99,102,241,0.2); color: #94a3b8; padding: 0.4rem 0.8rem; border-radius: 8px; cursor: pointer; font-size: 0.85rem; transition: border-color 0.2s; }
        .back-btn:hover { border-color: #6366f1; color: #e2e8f0; }
        .upload-btn { display: inline-block; padding: 0.6rem 1.2rem; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; border-radius: 10px; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: opacity 0.2s; }
        .upload-btn:hover { opacity: 0.9; }
        .upload-error { max-width: 1100px; margin: 0 auto 1rem; padding: 0.75rem 1rem; background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); border-radius: 10px; color: #fca5a5; font-size: 0.9rem; }
        .empty-state { text-align: center; padding: 4rem 2rem; }
        .empty-icon { font-size: 3rem; margin-bottom: 1rem; }
        .empty-state h2 { color: #94a3b8; font-size: 1.3rem; margin-bottom: 0.5rem; }
        .empty-state p { color: #64748b; }
        .documents-table-wrapper { max-width: 1100px; margin: 0 auto; overflow-x: auto; }
        .documents-table { width: 100%; border-collapse: collapse; }
        .documents-table th { text-align: left; padding: 0.75rem 1rem; color: #64748b; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid rgba(99,102,241,0.1); }
        .documents-table td { padding: 0.85rem 1rem; border-bottom: 1px solid rgba(99,102,241,0.05); font-size: 0.9rem; }
        .documents-table tr:hover { background: rgba(99,102,241,0.05); }
        .doc-title { font-weight: 500; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .doc-file { color: #94a3b8; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .doc-email { color: #94a3b8; font-size: 0.8rem; }
        .doc-date { color: #64748b; font-size: 0.8rem; white-space: nowrap; }
        .status-badge { padding: 0.25rem 0.6rem; border-radius: 6px; font-size: 0.8rem; font-weight: 500; border: 1px solid currentColor; }
      `}</style>
    </div>
  );
}
