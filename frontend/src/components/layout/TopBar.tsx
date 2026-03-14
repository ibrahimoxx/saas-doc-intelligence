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
    <header className="nav-border sticky top-0 z-30 bg-[#0d111c]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Left: Brand + Tenant selector */}
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-extrabold tracking-tight text-gradient font-heading">
            DocPilot AI
          </h1>

          {tenants.length > 0 && (
            <div className="relative">
              <select
                value={selectedTenantId || ""}
                onChange={(e) => onTenantChange?.(e.target.value)}
                className="appearance-none bg-white/5 border border-white/10 text-slate-300 text-sm rounded-xl py-1.5 pl-3 pr-8 focus:outline-none focus:border-indigo-500/60 transition-colors cursor-pointer"
              >
                {tenants.map((m) => (
                  <option
                    key={m.tenant.id}
                    value={m.tenant.id}
                    className="bg-slate-900"
                  >
                    {m.tenant.name} · {m.role}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            </div>
          )}
        </div>

        {/* Right: email + admin + logout */}
        <div className="flex items-center gap-3">
          {userEmail && (
            <span className="hidden sm:block text-sm text-slate-400 font-medium">
              {userEmail}
            </span>
          )}

          {isSuperuser && (
            <button
              onClick={onAdminDashboard}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              Admin
            </button>
          )}

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </div>
    </header>
  );
}
