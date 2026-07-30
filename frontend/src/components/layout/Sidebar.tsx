// src/components/layout/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  Users,
  Database,
  History,
  ShieldCheck,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";

interface SidebarLink {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  userEmail?: string;
  userFullName?: string;
  role?: string;
  isSuperuser?: boolean;
}

const BASE_NAV_LINKS: SidebarLink[] = [
  { href: "/dashboard",  label: "Dashboard",  icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: "/chat",       label: "Chat IA",    icon: <MessageSquare className="w-4 h-4" /> },
  { href: "/documents",  label: "Documents",  icon: <FileText className="w-4 h-4" /> },
  { href: "/membres",    label: "Membres",    icon: <Users className="w-4 h-4" /> },
  { href: "/espaces",    label: "Espaces",    icon: <Database className="w-4 h-4" /> },
];

const ADMIN_NAV_LINKS: SidebarLink[] = [
  { href: "/historique", label: "Historique", icon: <History className="w-4 h-4" /> },
];

export function Sidebar({ userEmail, userFullName, role, isSuperuser }: SidebarProps) {
  const pathname = usePathname();

  const links = [
    ...BASE_NAV_LINKS,
    ...(role === "admin" || role === "owner" ? ADMIN_NAV_LINKS : []),
  ];

  return (
    <aside className="fixed left-0 top-0 bottom-0 z-40 flex w-[236px] flex-col border-r border-border-subtle bg-bg-sidebar">
      {/* Brand */}
      <div className="flex items-center gap-2.5 border-b border-border-subtle px-5 pb-[18px] pt-5">
        <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-md bg-fg-primary">
          <span className="h-2.5 w-2.5 bg-bg-base" />
        </div>
        <span className="text-[14.5px] font-bold tracking-[-0.01em] text-fg-primary">
          DocPilot <span className="text-brand-primary">AI</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-3.5">
        {links.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              className={[
                "flex items-center gap-2.5 rounded-[7px] px-2.5 py-[9px] text-[13px] transition-colors",
                isActive
                  ? "bg-brand-soft font-semibold text-brand-primary"
                  : "font-medium text-fg-secondary hover:bg-bg-elevated-1 hover:text-fg-primary",
              ].join(" ")}
            >
              <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                {link.icon}
              </span>
              {link.label}
            </Link>
          );
        })}

        {isSuperuser && (
          <>
            <div className="my-2.5 mx-0.5 h-px bg-border-subtle" />
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-2.5 rounded-[7px] px-2.5 py-[9px] text-[13px] font-medium text-fg-secondary transition-colors hover:bg-bg-elevated-1 hover:text-fg-primary"
            >
              <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                <ShieldCheck className="h-4 w-4" />
              </span>
              Console admin
            </Link>
          </>
        )}
      </nav>

      {/* User */}
      <div className="flex flex-col gap-2.5 border-t border-border-subtle px-3 py-3.5">
        <div className="flex items-center gap-2.5">
          <Avatar name={userFullName} email={userEmail} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-semibold text-fg-primary">
              {userFullName || userEmail}
            </p>
            {userFullName && userEmail && (
              <p className="truncate text-[11px] text-fg-tertiary">{userEmail}</p>
            )}
          </div>
        </div>
        {role && (
          <span className="inline-flex w-fit items-center gap-1.5 rounded-[5px] border border-border-subtle bg-bg-elevated-1 px-2 py-[3px] text-[10.5px] font-semibold uppercase tracking-[0.04em] text-fg-secondary">
            <span className="h-[5px] w-[5px] rounded-full bg-brand-primary" />
            {role}
          </span>
        )}
      </div>
    </aside>
  );
}
