/**
 * DocPilot AI — Admin Types (Super Owner)
 */

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  membership_count: number;
}

export interface AdminTenant {
  id: string;
  name: string;
  slug: string;
  status: "active" | "suspended" | "trial";
  created_at: string;
  member_count: number;
  space_count: number;
  document_count: number;
  owner_assigned?: boolean;
  message?: string;
}

export interface AdminTenantMember {
  id: string;
  user_id: string;
  user_email: string;
  user_full_name: string;
  role: string;
  status: string;
}

export interface AdminTenantDetail extends AdminTenant {
  members: AdminTenantMember[];
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
