/**
 * DocPilot AI — Tenant Types
 */

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: "active" | "suspended" | "trial";
  created_at: string;
}

export interface TenantMembership {
  id: string;
  tenant: Tenant;
  role: "owner" | "admin" | "manager" | "member";
  status: "active" | "invited" | "disabled";
}

export interface TenantMember {
  id: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    is_superuser: boolean;
  };
  role: "owner" | "admin" | "manager" | "member";
  status: "active" | "invited" | "disabled";
  created_at: string;
}

export interface KnowledgeSpace {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
  document_count?: number;
  created_at: string;
}

export interface TenantPermissions {
  role: string;
  can_upload: boolean;
  can_delete_documents: boolean;
  can_manage_members: boolean;
  can_view_admin: boolean;
  accessible_space_ids: string[];
}

export interface SpaceAccessProfile {
  id: string;
  name: string;
  description: string;
  spaces: KnowledgeSpace[];
  created_at: string;
}

export interface UserSpaceAccess {
  id: string;
  space: KnowledgeSpace;
  granted_by: { id: string; email: string; full_name: string } | null;
  created_at: string;
}

export interface UserSpaceProfileAssignment {
  id: string;
  profile: SpaceAccessProfile;
  granted_by: { id: string; email: string; full_name: string } | null;
  created_at: string;
}

export interface DocumentVersion {
  id: string;
  version_number: number;
  file_name: string;
  mime_type: string;
  file_size_bytes: number;
  page_count: number | null;
  indexing_status: string;
  created_at: string;
}

export interface Document {
  id: string;
  title: string;
  status: string;
  knowledge_space_id: string;
  created_by_email: string | null;
  current_version: DocumentVersion | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentProcessingJob {
  id: string;
  job_type: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  created_at: string;
}

export interface TenantSummary {
  documents: number;
  conversations: number;
  members: number;
  spaces: number;
}

export interface UserInvitation {
  id: string;
  email: string;
  role: "owner" | "admin" | "manager" | "member";
  invited_by: { id: string; email: string; full_name: string } | null;
  expires_at: string;
  created_at: string;
}
