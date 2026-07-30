import type { ReactNode } from "react";
import { TenantsProvider } from "@/hooks/useTenants";
import { AppShell } from "@/components/layout/AppShell";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <TenantsProvider>
      <AppShell>{children}</AppShell>
    </TenantsProvider>
  );
}
