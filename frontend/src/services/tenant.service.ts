/**
 * DocPilot AI — Tenant Service
 *
 * Functions for tenancy endpoints.
 */

import { apiClient, type ApiResponse } from "@/lib/api-client";
import type { Tenant, TenantMembership, TenantPermissions, KnowledgeSpace } from "@/types/tenant.types";

export const tenantService = {
  /**
   * List my tenants.
   */
  async myTenants(): Promise<ApiResponse<TenantMembership[]>> {
    return apiClient.get("/tenants/");
  },

  /**
   * Create a new tenant.
   */
  async create(name: string, slug: string): Promise<ApiResponse<Tenant>> {
    return apiClient.post("/tenants/", { name, slug });
  },

  /**
   * Get tenant details.
   */
  async detail(tenantId: string): Promise<ApiResponse<Tenant>> {
    return apiClient.get(`/tenants/${tenantId}/`);
  },

  /**
   * Get my permissions in a tenant.
   */
  async myPermissions(tenantId: string): Promise<ApiResponse<TenantPermissions>> {
    return apiClient.get(`/tenants/${tenantId}/me/permissions/`);
  },

  /**
   * List members of a tenant.
   */
  async members(tenantId: string): Promise<ApiResponse<unknown[]>> {
    return apiClient.get(`/tenants/${tenantId}/members/`);
  },

  /**
   * Invite a member to a tenant.
   */
  async inviteMember(tenantId: string, email: string, role: string = "member"): Promise<ApiResponse<unknown>> {
    return apiClient.post(`/tenants/${tenantId}/members/`, { email, role });
  },

  /**
   * List knowledge spaces for a tenant.
   */
  async knowledgeSpaces(tenantId: string): Promise<ApiResponse<KnowledgeSpace[]>> {
    return apiClient.get(`/tenants/${tenantId}/spaces/`);
  },
};
