/**
 * DocPilot AI — Document Types
 */

export interface Document {
  id: string;
  tenant_id: string;
  knowledge_space_id: string;
  title: string;
  status: "queued" | "processing" | "indexed" | "failed";
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  current_version?: DocumentVersion;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  file_name: string;
  mime_type: string;
  file_size_bytes: number;
  page_count: number | null;
  indexing_status: "queued" | "processing" | "indexed" | "failed";
  created_at: string;
}
