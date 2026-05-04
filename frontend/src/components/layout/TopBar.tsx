"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ChevronDown,
  LogOut,
  Shield,
  User as UserIcon,
  LayoutDashboard,
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
    <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between gap-6 px-6 py-3 border-b border-border-subtle bg-bg-base/80 backdrop-blur-md">
      {/* Brand */}
      <Link href="/dashboard" className="flex items-center gap-3 group">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl aurora-bg shadow-[0_8px_24px_-8px_rgba(99,102,241,0.5)] group-hover:scale-105 transition-transform duration-300">
          <Image src="/brand/logo.svg" alt="DocPilot AI" width={20} height={20} />
        </div>
        <span className="font-display text-sm font-semibold tracking-[0.12em] text-fg-primary hidden sm:block">
          DocPilot <span className="text-brand-primary">AI</span>
        </span>
      </Link>

      {/* Center */}
      <div className="flex flex-1 items-center justify-center gap-3">
        {tenants.length > 0 && (
          <div className="relative">
            <select
              value={selectedTenantId || ""}
              onChange={(e) => onTenantChange?.(e.target.value)}
              className="appearance-none rounded-xl border border-border-subtle bg-bg-elevated-1 py-1.5 pl-3 pr-8 text-[11px] font-semibold uppercase tracking-widest text-fg-secondary focus:border-brand-primary focus:outline-none transition-colors cursor-pointer hover:border-border-strong"
            >
              {tenants.map((m) => (
                <option key={m.tenant.id} value={m.tenant.id} className="bg-bg-elevated-2">
                  {m.tenant.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-fg-tertiary" />
          </div>
        )}

        <div className="hidden h-4 w-px bg-border-subtle md:block" />

        <Link
          href="/dashboard"
          className="hidden md:flex items-center gap-1.5 rounded-xl border border-border-subtle bg-bg-elevated-1 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-fg-secondary hover:border-brand-primary hover:text-fg-primary transition-colors"
        >
          <LayoutDashboard className="h-3 w-3" />
          <span>Dashboard</span>
        </Link>

        {userEmail && (
          <div className="hidden lg:flex items-center gap-1.5 rounded-xl border border-border-subtle bg-bg-elevated-1 px-3 py-1.5">
            <UserIcon className="h-3 w-3 text-brand-primary" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-fg-tertiary">
              {userEmail.split("@")[0]}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {isSuperuser && (
          <button
            onClick={onAdminDashboard}
            className="flex items-center gap-1.5 rounded-xl border border-brand-primary/20 bg-brand-primary/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-brand-primary hover:bg-brand-primary/20 transition-colors"
          >
            <Shield className="h-3 w-3" />
            <span className="hidden sm:block">Console</span>
          </button>
        )}

        <button
          onClick={onLogout}
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-error/20 bg-error/10 text-error hover:bg-error/20 transition-colors"
          aria-label="Se déconnecter"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}
