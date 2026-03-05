/**
 * DocPilot AI — Auth Types
 */

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
}

export interface TokenRefreshRequest {
  refresh: string;
}

export interface TokenRefreshResponse {
  access: string;
  refresh: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  is_superuser?: boolean;
  is_active: boolean;
  created_at: string;
}
