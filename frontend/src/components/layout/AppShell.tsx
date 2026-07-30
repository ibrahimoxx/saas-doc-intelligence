"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Database,
  FileText,
  History,
  LayoutDashboard,
  MessageSquare,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTenants } from "@/hooks/useTenants";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { CommandPalette } from "@/components/ui/CommandPalette";

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, logout, isLoading, isAuthenticated } = useAuth();
  const { tenants, selectedTenantId, setSelectedTenantId } = useTenants();
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const role = tenants.find((m) => m.tenant.id === selectedTenantId)?.role;

  const paletteItems = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" />, group: "Navigation", onSelect: () => router.push("/dashboard") },
    { id: "chat", label: "Chat IA", icon: <MessageSquare className="h-4 w-4" />, group: "Navigation", onSelect: () => router.push("/chat") },
    { id: "documents", label: "Documents", icon: <FileText className="h-4 w-4" />, group: "Navigation", onSelect: () => router.push("/documents") },
    { id: "membres", label: "Membres", icon: <Users className="h-4 w-4" />, group: "Navigation", onSelect: () => router.push("/membres") },
    { id: "espaces", label: "Espaces", icon: <Database className="h-4 w-4" />, group: "Navigation", onSelect: () => router.push("/espaces") },
    ...(role === "admin" || role === "owner"
      ? [{ id: "historique", label: "Historique", icon: <History className="h-4 w-4" />, group: "Navigation", onSelect: () => router.push("/historique") }]
      : []),
    ...(user?.is_superuser
      ? [{ id: "admin", label: "Console admin", icon: <ShieldCheck className="h-4 w-4" />, group: "Administration", onSelect: () => router.push("/admin/dashboard") }]
      : []),
  ];

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  // Pages own the redirect; the shell just avoids flashing chrome to signed-out visitors.
  if (isLoading || !isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-bg-base">
      <Sidebar
        userEmail={user?.email}
        userFullName={user?.full_name}
        role={role}
        isSuperuser={user?.is_superuser}
      />

      <div className="ml-[236px] flex min-h-screen flex-col">
        <TopBar
          userEmail={user?.email}
          userFullName={user?.full_name}
          tenants={tenants}
          selectedTenantId={selectedTenantId}
          onTenantChange={setSelectedTenantId}
          onLogout={handleLogout}
          onSearch={() => setPaletteOpen(true)}
        />

        <main id="main" className="flex flex-1 flex-col">
          {children}
        </main>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} items={paletteItems} />
    </div>
  );
}
