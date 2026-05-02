import { apiClient, ApiResponse } from "@/lib/api-client";
import type { AdminTenant, AdminTenantDetail, AdminUser, PaginatedResponse } from "@/types/admin.types";

export interface AdminStatsResponse {
  totals: {
    tenants: number;
    users: number;
    documents: number;
    queries: number;
  };
  recent_activity: {
    new_tenants_7d: number;
    new_users_7d: number;
    new_documents_7d: number;
    queries_7d: number;
  };
}

export interface AdminRecentQuery {
  id: string;
  tenant_name: string;
  user_email: string;
  question: string;
  answer_preview: string;
  model_used: string;
  total_tokens: number;
  created_at: string;
}

export const adminService = {
  /**
   * Get global platform statistics (Superuser only)
   */
  getAdminStats: (): Promise<ApiResponse<AdminStatsResponse>> => {
    return apiClient.get<AdminStatsResponse>("/admin/stats/");
  },

  /**
   * Get recent queries across all tenants (Superuser only)
   */
  getRecentQueries: (): Promise<ApiResponse<AdminRecentQuery[]>> => {
    return apiClient.get<AdminRecentQuery[]>("/admin/queries/recent/");
  },

  // TENANT MANAGEMENT
  listTenants: (params?: { search?: string; status?: string; page?: number }): Promise<ApiResponse<PaginatedResponse<AdminTenant>>> => {
    const q = new URLSearchParams();
    if (params?.search) q.set("search", params.search);
    if (params?.status) q.set("status", params.status);
    if (params?.page) q.set("page", String(params.page));
    const qs = q.toString();
    return apiClient.get(`/admin/tenants/${qs ? "?" + qs : ""}`);
  },
  createTenant: (data: { name: string; slug: string; owner_email: string }): Promise<ApiResponse<AdminTenant>> => {
    return apiClient.post("/admin/tenants/", data);
  },
  getTenant: (tenantId: string): Promise<ApiResponse<AdminTenantDetail>> => {
    return apiClient.get(`/admin/tenants/${tenantId}/`);
  },
  updateTenantStatus: (tenantId: string, status: string): Promise<ApiResponse<AdminTenant>> => {
    return apiClient.patch(`/admin/tenants/${tenantId}/`, { status });
  },
  assignMembership: (tenantId: string, user_email: string, role: string): Promise<ApiResponse<{ id: string; user_email: string; role: string; status: string }>> => {
    return apiClient.post(`/admin/tenants/${tenantId}/memberships/`, { user_email, role });
  },

  // USER MANAGEMENT
  listUsers: (params?: { search?: string; is_active?: boolean; is_superuser?: boolean; page?: number }): Promise<ApiResponse<PaginatedResponse<AdminUser>>> => {
    const q = new URLSearchParams();
    if (params?.search) q.set("search", params.search);
    if (params?.is_active !== undefined) q.set("is_active", String(params.is_active));
    if (params?.is_superuser !== undefined) q.set("is_superuser", String(params.is_superuser));
    if (params?.page) q.set("page", String(params.page));
    const qs = q.toString();
    return apiClient.get(`/admin/users/${qs ? "?" + qs : ""}`);
  },
  updateUser: (userId: string, data: { is_active?: boolean; is_superuser?: boolean; full_name?: string }): Promise<ApiResponse<AdminUser>> => {
    return apiClient.patch(`/admin/users/${userId}/`, data);
  },
};
