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

export interface KnowledgeSpace {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

export interface TenantPermissions {
  role: string;
  can_upload: boolean;
  can_delete_documents: boolean;
  can_manage_members: boolean;
  can_view_admin: boolean;
}
