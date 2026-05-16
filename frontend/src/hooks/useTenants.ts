"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { tenantService } from "@/services/tenant.service";
import { adminService } from "@/services/admin.service";
import type { TenantMembership } from "@/types/tenant.types";

const STORAGE_KEY = "docpilot_selected_tenant";

interface UseTenantsResult {
  tenants: TenantMembership[];
  selectedTenantId: string | null;
  setSelectedTenantId: (id: string) => void;
  loading: boolean;
}

export function useTenants(): UseTenantsResult {
  const { user, isAuthenticated } = useAuth();
  const [tenants, setTenants] = useState<TenantMembership[]>([]);
  const [selectedTenantId, setSelectedTenantIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const setSelectedTenantId = useCallback((id: string) => {
    localStorage.setItem(STORAGE_KEY, id);
    setSelectedTenantIdState(id);
  }, []);

  const pickDefault = useCallback((data: TenantMembership[]) => {
    if (data.length === 0) return;
    const saved = localStorage.getItem(STORAGE_KEY);
    const match = saved && data.find((m) => m.tenant.id === saved);
    setSelectedTenantIdState(match ? saved! : data[0].tenant.id);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    if (user?.is_superuser) {
      adminService.listTenants().then((res) => {
        if (res.data?.results) {
          const data: TenantMembership[] = res.data.results.map((t) => ({
            id: t.id,
            tenant: { id: t.id, name: t.name, slug: t.slug, status: t.status, created_at: t.created_at },
            role: "owner" as const,
            status: "active" as const,
          }));
          setTenants(data);
          pickDefault(data);
        }
        setLoading(false);
      });
    } else {
      tenantService.myTenants().then((res) => {
        if (res.data) {
          const data = res.data as unknown as TenantMembership[];
          setTenants(data);
          pickDefault(data);
        }
        setLoading(false);
      });
    }
  }, [isAuthenticated, user?.is_superuser, pickDefault]);

  return { tenants, selectedTenantId, setSelectedTenantId, loading };
}
