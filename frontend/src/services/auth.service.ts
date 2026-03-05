/**
 * DocPilot AI — Auth Service
 *
 * Functions for authentication endpoints.
 */

import { apiClient, type ApiResponse } from "@/lib/api-client";
import type { LoginResponse, UserProfile } from "@/types/auth.types";

export const authService = {
  /**
   * Login with email + password.
   */
  async login(email: string, password: string): Promise<ApiResponse<LoginResponse & { user: UserProfile }>> {
    return apiClient.post("/auth/login/", { email, password });
  },

  /**
   * Register a new account.
   */
  async register(
    email: string,
    full_name: string,
    password: string,
    password_confirm: string
  ): Promise<ApiResponse<LoginResponse & { user: UserProfile }>> {
    return apiClient.post("/auth/register/", { email, full_name, password, password_confirm });
  },

  /**
   * Refresh access token.
   */
  async refresh(refreshToken: string): Promise<ApiResponse<{ access: string; refresh: string }>> {
    return apiClient.post("/auth/refresh/", { refresh: refreshToken });
  },

  /**
   * Logout (blacklists the refresh token).
   */
  async logout(refreshToken: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post("/auth/logout/", { refresh: refreshToken });
  },

  /**
   * Get current user profile.
   */
  async me(): Promise<ApiResponse<UserProfile>> {
    return apiClient.get("/auth/me/");
  },

  /**
   * Update current user profile.
   */
  async updateProfile(data: { full_name?: string }): Promise<ApiResponse<UserProfile>> {
    return apiClient.patch("/auth/me/", data);
  },

  /**
   * Change password.
   */
  async changePassword(
    current_password: string,
    new_password: string,
    new_password_confirm: string
  ): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post("/auth/change-password/", {
      current_password,
      new_password,
      new_password_confirm,
    });
  },
};
