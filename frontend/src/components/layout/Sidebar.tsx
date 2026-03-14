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
  ArrowLeft,
  Zap,
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
  /** Link to go back to the standard dashboard */
  backHref?: string;
  backLabel?: string;
}

const NAV_LINKS: SidebarLink[] = [
  { href: "/dashboard",  label: "Dashboard",      icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: "/chat",       label: "Chat IA",        icon: <MessageSquare className="w-4 h-4" /> },
  { href: "/documents",  label: "Documents",      icon: <FileText className="w-4 h-4" /> },
  { href: "/membres",    label: "Membres",        icon: <Users className="w-4 h-4" /> },
  { href: "/espaces",    label: "Espaces",        icon: <Database className="w-4 h-4" /> },
];

export function Sidebar({
  userEmail,
  userFullName,
  role,
  backHref,
  backLabel = "← Retour",
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-full w-[var(--sidebar-w,260px)] flex flex-col bg-[#0d111c] border-r border-white/5">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-gradient text-lg tracking-tight font-heading">
            DocPilot AI
          </span>
        </div>
      </div>

      {/* Back link (optional) */}
      {backHref && (
        <div className="px-3 pt-3">
          <Link
            href={backHref}
            className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-200 transition-colors px-2 py-1.5 rounded-lg hover:bg-white/5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {backLabel}
          </Link>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {NAV_LINKS.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              className={[
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/20"
                  : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent",
              ].join(" ")}
            >
              <span
                className={isActive ? "text-indigo-400" : "text-slate-500"}
              >
                {link.icon}
              </span>
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* User profile */}
      <div className="px-3 py-4 border-t border-white/5">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors">
          <Avatar name={userFullName} email={userEmail} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-200 truncate">
              {userFullName || userEmail}
            </p>
            {role && (
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                {role}
              </p>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
