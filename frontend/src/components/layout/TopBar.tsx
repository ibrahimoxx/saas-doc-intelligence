"use client";

import { ChevronDown, LogOut, Moon, Search, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import type { TenantMembership } from "@/types/tenant.types";
import { Avatar } from "@/components/ui/Avatar";

interface TopBarProps {
  userEmail?: string;
  userFullName?: string;
  tenants?: TenantMembership[];
  selectedTenantId?: string | null;
  onTenantChange?: (id: string) => void;
  onLogout?: () => void;
  onSearch?: () => void;
}

export function TopBar({
  userEmail,
  userFullName,
  tenants = [],
  selectedTenantId,
  onTenantChange,
  onLogout,
  onSearch,
}: TopBarProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const currentTenant = tenants.find((m) => m.tenant.id === selectedTenantId);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-border-subtle bg-bg-base px-6">
      {/* Tenant switcher */}
      <div className="flex items-center gap-2.5">
        {tenants.length > 0 && (
          <div className="relative">
            <select
              value={selectedTenantId || ""}
              onChange={(e) => onTenantChange?.(e.target.value)}
              aria-label="Organisation active"
              className="appearance-none rounded-[7px] border border-border-subtle bg-bg-elevated-1 py-1.5 pl-2.5 pr-7 text-[12.5px] font-semibold text-fg-primary transition-colors hover:border-border-strong focus:border-brand-primary focus:outline-none"
            >
              {tenants.map((m) => (
                <option key={m.tenant.id} value={m.tenant.id}>
                  {m.tenant.status === "suspended" ? `⚠ ${m.tenant.name} (suspendu)` : m.tenant.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-fg-tertiary" />
          </div>
        )}

        {currentTenant?.tenant.status === "suspended" && (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-warning-border bg-warning-bg px-2.5 py-1 text-[11.5px] font-semibold text-warning">
            Tenant suspendu — accès restreint
          </span>
        )}
      </div>

      {/* Search trigger */}
      {onSearch && (
        <button
          type="button"
          onClick={onSearch}
          className="hidden w-[340px] max-w-[40vw] items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated-1 px-2.5 py-1.5 text-left transition-colors hover:border-border-strong md:flex"
        >
          <Search className="h-3.5 w-3.5 shrink-0 text-fg-tertiary" />
          <span className="flex-1 truncate text-[12.5px] text-fg-tertiary">
            Rechercher documents, membres, espaces…
          </span>
          <span className="rounded border border-border-subtle px-1.5 py-px font-mono text-[10.5px] text-fg-tertiary">
            ⌘K
          </span>
        </button>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          aria-label={isDark ? "Passer en thème clair" : "Passer en thème sombre"}
          className="flex h-8 w-8 items-center justify-center rounded-[7px] border border-border-subtle bg-bg-elevated-1 text-fg-secondary transition-colors hover:border-border-strong hover:text-fg-primary"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <button
          type="button"
          onClick={onLogout}
          aria-label="Se déconnecter"
          className="flex h-8 w-8 items-center justify-center rounded-[7px] border border-border-subtle bg-bg-elevated-1 text-fg-secondary transition-colors hover:border-error-border hover:bg-error-bg hover:text-error"
        >
          <LogOut className="h-4 w-4" />
        </button>

        <div className="h-5 w-px bg-border-subtle" />

        <Avatar name={userFullName} email={userEmail} size="sm" />
      </div>
    </header>
  );
}
