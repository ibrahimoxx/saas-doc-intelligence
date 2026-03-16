// src/components/layout/TopBar.tsx
"use client";

import { ChevronDown, LogOut, Shield } from "lucide-react";
import type { TenantMembership } from "@/types/tenant.types";

interface TopBarProps {
  userEmail?: string;
  isSuperuser?: boolean;
  tenants?: TenantMembership[];
  selectedTenantId?: string | null;
  onTenantChange?: (id: string) => void;
  onLogout?: () => void;
  onAdminDashboard?: () => void;
}

export function TopBar({
  userEmail,
  isSuperuser,
  tenants = [],
  selectedTenantId,
  onTenantChange,
  onLogout,
  onAdminDashboard,
}: TopBarProps) {
  return (
    <header className="nav-border sticky top-0 z-30 bg-[#131722] py-4 px-8 border-b border-white/5" data-purpose="main-header">
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
        {/* Left: Brand */}
        <div className="flex items-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-gradient font-heading" style={{ backgroundImage: 'var(--gradient-header)' }}>
            DocPilot AI
          </h1>
        </div>

        {/* Right: controls */}
        <div className="flex items-center space-x-6">
          {/* Tenant Selector */}
          {tenants.length > 0 && (
            <div className="relative">
              <select
                value={selectedTenantId || ""}
                onChange={(e) => onTenantChange?.(e.target.value)}
                className="appearance-none bg-[#1e2330] border border-gray-600 text-gray-300 text-sm rounded-md py-2 pl-4 pr-8 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer"
                data-purpose="tenant-selector"
              >
                {tenants.map((m) => (
                  <option
                    key={m.tenant.id}
                    value={m.tenant.id}
                    className="bg-[#1e2330]"
                  >
                    Tenant: {m.tenant.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
          )}

          {userEmail && (
            <span className="text-gray-300 text-sm font-medium hidden md:inline" data-purpose="user-email">
              {userEmail}
            </span>
          )}

          {isSuperuser && (
            <button
              onClick={onAdminDashboard}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              Admin
            </button>
          )}

          <button
            onClick={onLogout}
            className="transition-colors text-sm font-medium py-2 px-6 rounded-md"
            data-purpose="logout-button"
            style={{ border: "1px solid #5a2e37", backgroundColor: "rgba(255, 0, 0, 0.1)", color: "#d66571" }}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
