import { apiClient, ApiResponse } from "@/lib/api-client";

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
};
