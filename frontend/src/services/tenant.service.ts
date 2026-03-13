/**
 * DocPilot AI — Tenant Service
 */

import { apiClient, type ApiResponse } from "@/lib/api-client";
import type { Tenant, TenantMembership, TenantPermissions, KnowledgeSpace, TenantMember } from "@/types/tenant.types";

export const tenantService = {
  /** List my tenants. */
  async myTenants(): Promise<ApiResponse<TenantMembership[]>> {
    return apiClient.get("/tenants/");
  },

  /** Create a new tenant. */
  async create(name: string, slug: string): Promise<ApiResponse<Tenant>> {
    return apiClient.post("/tenants/", { name, slug });
  },

  /** Get tenant details. */
  async detail(tenantId: string): Promise<ApiResponse<Tenant>> {
    return apiClient.get(`/tenants/${tenantId}/`);
  },

  /** Get my permissions in a tenant. */
  async myPermissions(tenantId: string): Promise<ApiResponse<TenantPermissions>> {
    return apiClient.get(`/tenants/${tenantId}/me/permissions/`);
  },

  // MEMBERS

  /** List all members of a tenant. */
  async members(tenantId: string): Promise<ApiResponse<TenantMember[]>> {
    return apiClient.get(`/tenants/${tenantId}/members/`);
  },

  /** Invite a member to a tenant by email. */
  async inviteMember(tenantId: string, email: string, role: string = "member"): Promise<ApiResponse<TenantMember>> {
    return apiClient.post(`/tenants/${tenantId}/members/`, { email, role });
  },

  /** Update a member's role. */
  async updateMemberRole(tenantId: string, memberId: string, role: string): Promise<ApiResponse<TenantMember>> {
    return apiClient.patch(`/tenants/${tenantId}/members/${memberId}/`, { role });
  },

  /** Remove a member from the tenant. */
  async removeMember(tenantId: string, memberId: string): Promise<ApiResponse<null>> {
    return apiClient.delete(`/tenants/${tenantId}/members/${memberId}/`);
  },

  // KNOWLEDGE SPACES

  /** List knowledge spaces for a tenant. */
  async knowledgeSpaces(tenantId: string): Promise<ApiResponse<KnowledgeSpace[]>> {
    return apiClient.get(`/tenants/${tenantId}/spaces/`);
  },

  /** Create a new knowledge space. */
  async createSpace(tenantId: string, data: { name: string; slug: string; description?: string }): Promise<ApiResponse<KnowledgeSpace>> {
    return apiClient.post(`/tenants/${tenantId}/spaces/`, data);
  },
};
