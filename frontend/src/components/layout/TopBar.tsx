// src/components/layout/TopBar.tsx
"use client";

import Link from "next/link";
import { 
  ChevronDown, 
  LogOut, 
  Shield, 
  User as UserIcon,
  LayoutDashboard 
} from "lucide-react";
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
    <nav className="nav-pill flex items-center justify-between gap-8 group/nav transition-all duration-700">
      {/* Left: Brand */}
      <Link href="/dashboard" className="flex items-center gap-4 interactive-premium group/brand">
        <div className="w-10 h-10 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover/brand:scale-110 transition-transform duration-500">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-xl font-black tracking-tighter text-white hidden sm:block">
          DOCPILOT <span className="text-indigo-400">AI</span>
        </h1>
      </Link>

      {/* Center: Tenant Selection & Controls */}
      <div className="flex-1 flex items-center justify-center gap-4">
        {tenants.length > 0 && (
          <div className="relative group/select">
            <select
              value={selectedTenantId || ""}
              onChange={(e) => onTenantChange?.(e.target.value)}
              className="appearance-none bg-white/5 border border-white/10 text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl py-2 pl-4 pr-10 focus:outline-none focus:border-indigo-500/50 transition-all cursor-pointer hover:bg-white/10 interactive-premium"
            >
              {tenants.map((m) => (
                <option key={m.tenant.id} value={m.tenant.id} className="bg-[#0f172a]">
                  {m.tenant.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none group-hover/select:text-indigo-400 transition-colors" />
          </div>
        )}

        <div className="h-4 w-px bg-white/10 hidden md:block" />

        {/* Explicit Dashboard Link */}
        <Link 
          href="/dashboard"
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all group/dash interactive-premium"
        >
          <LayoutDashboard className="w-3.5 h-3.5 text-indigo-400 group-hover/dash:scale-110 transition-transform" />
          <span className="text-white text-[9px] font-black uppercase tracking-widest hidden md:block">
            Dashboard
          </span>
        </Link>

        {userEmail && (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
            <UserIcon className="w-3 h-3 text-indigo-400" />
            <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
              {userEmail.split('@')[0]}
            </span>
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {isSuperuser && (
          <button
            onClick={onAdminDashboard}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all text-[9px] font-black uppercase tracking-widest interactive-premium"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Console</span>
          </button>
        )}

        <button
          onClick={onLogout}
          className="p-2.5 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all group/logout interactive-premium"
        >
          <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        </button>
      </div>
    </nav>
  );
}
