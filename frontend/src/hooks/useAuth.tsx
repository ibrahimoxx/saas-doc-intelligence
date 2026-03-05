"use client";

/**
 * DocPilot AI — Auth Context
 *
 * Global state for authentication (user, tokens, login/logout).
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { UserProfile } from "@/types/auth.types";
import { authService } from "@/services/auth.service";

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check saved tokens on mount
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      refreshUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authService.login(email, password);
    if (res.error) {
      return { ok: false, error: res.error.message };
    }
    if (res.data) {
      localStorage.setItem("access_token", res.data.access);
      localStorage.setItem("refresh_token", res.data.refresh);
      setUser(res.data.user);
      return { ok: true };
    }
    return { ok: false, error: "Erreur inconnue." };
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    if (refreshToken) {
      await authService.logout(refreshToken);
    }
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
  };

  const refreshUser = async () => {
    const res = await authService.me();
    if (res.data) {
      setUser(res.data);
    } else {
      // Token expired — try refresh
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        const refreshRes = await authService.refresh(refreshToken);
        if (refreshRes.data) {
          localStorage.setItem("access_token", refreshRes.data.access);
          localStorage.setItem("refresh_token", refreshRes.data.refresh);
          const meRes = await authService.me();
          if (meRes.data) {
            setUser(meRes.data);
            return;
          }
        }
      }
      // Failed to refresh — logout
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
