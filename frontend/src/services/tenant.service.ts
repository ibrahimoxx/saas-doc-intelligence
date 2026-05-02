/**
 * DocPilot AI — Tenant Service
 */

import { apiClient, type ApiResponse } from "@/lib/api-client";
import type {
  Tenant,
  TenantMembership,
  TenantPermissions,
  KnowledgeSpace,
  TenantMember,
  Document,
  TenantSummary,
  SpaceAccessProfile,
  UserSpaceAccess,
  UserSpaceProfileAssignment,
  UserInvitation,
} from "@/types/tenant.types";

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

  /** Alias for members to support modern UI. */
  async listMembers(tenantId: string): Promise<ApiResponse<TenantMember[]>> {
    return this.members(tenantId);
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

  /** Delete a knowledge space. */
  async deleteSpace(tenantId: string, spaceId: string): Promise<ApiResponse<null>> {
    return apiClient.delete(`/tenants/${tenantId}/spaces/${spaceId}/`);
  },

  // DOCUMENTS

  /** List documents for a tenant, optionally filtered by space. */
  async listDocuments(tenantId: string, spaceId?: string): Promise<ApiResponse<Document[]>> {
    const url = `/tenants/${tenantId}/documents/${spaceId ? `?space_id=${spaceId}` : ""}`;
    return apiClient.get(url);
  },

  /** Upload a document to a workspace. */
  async uploadDocument(tenantId: string, spaceId: string, file: File): Promise<ApiResponse<Document>> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("knowledge_space_id", spaceId);
    
    return apiClient.uploadFile(`/tenants/${tenantId}/documents/`, formData);
  },

  /** Delete a document. */
  async deleteDocument(tenantId: string, spaceId: string, docId: string): Promise<ApiResponse<null>> {
    return apiClient.delete(`/tenants/${tenantId}/documents/${docId}/?space_id=${spaceId}`);
  },

  /** Get tenant summary statistics. */
  async getTenantSummary(tenantId: string): Promise<ApiResponse<TenantSummary>> {
    return apiClient.get(`/tenants/${tenantId}/summary/`);
  },

  // SPACE ACCESS PROFILES

  /** List all space access profiles for a tenant. */
  async listSpaceProfiles(tenantId: string): Promise<ApiResponse<SpaceAccessProfile[]>> {
    return apiClient.get(`/tenants/${tenantId}/space-profiles/`);
  },

  /** Create a space access profile. */
  async createSpaceProfile(
    tenantId: string,
    data: { name: string; description?: string; space_ids?: string[] }
  ): Promise<ApiResponse<SpaceAccessProfile>> {
    return apiClient.post(`/tenants/${tenantId}/space-profiles/`, data);
  },

  /** Update a space access profile. */
  async updateSpaceProfile(
    tenantId: string,
    profileId: string,
    data: { name?: string; description?: string; space_ids?: string[] }
  ): Promise<ApiResponse<SpaceAccessProfile>> {
    return apiClient.patch(`/tenants/${tenantId}/space-profiles/${profileId}/`, data);
  },

  /** Delete a space access profile. */
  async deleteSpaceProfile(tenantId: string, profileId: string): Promise<ApiResponse<null>> {
    return apiClient.delete(`/tenants/${tenantId}/space-profiles/${profileId}/`);
  },

  // USER SPACE ACCESS (direct grants)

  /** List direct space grants for a member. */
  async getUserSpaceAccess(tenantId: string, memberId: string): Promise<ApiResponse<UserSpaceAccess[]>> {
    return apiClient.get(`/tenants/${tenantId}/members/${memberId}/space-access/`);
  },

  /** Grant a member direct access to a space. */
  async grantSpaceAccess(tenantId: string, memberId: string, spaceId: string): Promise<ApiResponse<UserSpaceAccess>> {
    return apiClient.post(`/tenants/${tenantId}/members/${memberId}/space-access/`, { space_id: spaceId });
  },

  /** Revoke a member's direct access to a space. */
  async revokeSpaceAccess(tenantId: string, memberId: string, spaceId: string): Promise<ApiResponse<null>> {
    return apiClient.delete(`/tenants/${tenantId}/members/${memberId}/space-access/${spaceId}/`);
  },

  // USER SPACE PROFILE ASSIGNMENTS

  /** List profiles assigned to a member. */
  async getUserSpaceProfiles(tenantId: string, memberId: string): Promise<ApiResponse<UserSpaceProfileAssignment[]>> {
    return apiClient.get(`/tenants/${tenantId}/members/${memberId}/space-profiles/`);
  },

  /** Assign a profile to a member. */
  async assignSpaceProfile(tenantId: string, memberId: string, profileId: string): Promise<ApiResponse<UserSpaceProfileAssignment>> {
    return apiClient.post(`/tenants/${tenantId}/members/${memberId}/space-profiles/`, { profile_id: profileId });
  },

  /** Remove a profile from a member. */
  async removeSpaceProfile(tenantId: string, memberId: string, profileId: string): Promise<ApiResponse<null>> {
    return apiClient.delete(`/tenants/${tenantId}/members/${memberId}/space-profiles/${profileId}/`);
  },

  // MEMBER STATUS

  /** Toggle a member's status (active / disabled). */
  async updateMemberStatus(tenantId: string, memberId: string, status: "active" | "disabled"): Promise<ApiResponse<TenantMember>> {
    return apiClient.patch(`/tenants/${tenantId}/members/${memberId}/`, { status });
  },

  // INVITATIONS

  /** List pending invitations for a tenant. */
  async listInvitations(tenantId: string): Promise<ApiResponse<UserInvitation[]>> {
    return apiClient.get(`/tenants/${tenantId}/invitations/`);
  },

  /** Send a new invitation. */
  async sendInvitation(tenantId: string, email: string, role: string): Promise<ApiResponse<UserInvitation>> {
    return apiClient.post(`/tenants/${tenantId}/invitations/`, { email, role });
  },

  /** Revoke a pending invitation. */
  async revokeInvitation(tenantId: string, invitationId: string): Promise<ApiResponse<null>> {
    return apiClient.delete(`/tenants/${tenantId}/invitations/${invitationId}/`);
  },
};
