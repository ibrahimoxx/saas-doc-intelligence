// src/app/admin/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  Users,
  Settings,
  Shield,
  LogOut,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!isLoading && (!user || !user.is_superuser)) {
        router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || !user.is_superuser) {
    return (
      <div className="h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  const navItems = [
    { label: "Vue d'ensemble", href: "/admin/dashboard", icon: LayoutDashboard, available: true },
    { label: "Organisations", href: null, icon: Shield, available: false },
    { label: "Utilisateurs", href: null, icon: Users, available: false },
    { label: "Configuration", href: null, icon: Settings, available: false },
  ];

  return (
    <div className="h-screen flex text-slate-200 overflow-hidden bg-transparent">
      {/* Mesh background handled by root layout */}

      {/* Admin Floating Sidebar */}
      <aside className={`flex flex-col bg-white/[0.03] backdrop-blur-3xl border-r border-white/5 transition-all duration-700 m-6 rounded-[48px] ${isSidebarOpen ? "w-80" : "w-24 overflow-hidden"}`}>
         <div className="p-10 flex flex-col h-full gap-12">
            <div className="flex items-center gap-6 px-2">
               <div className="w-12 h-12 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-2xl">
                  <Shield className="w-6 h-6 text-white" />
               </div>
               {isSidebarOpen && (
                 <h1 className="text-xl font-black tracking-tighter text-white">
                   CENTRAL <span className="text-indigo-400">ADMIN</span>
                 </h1>
               )}
            </div>

            <nav className="flex-1 space-y-3">
              {navItems.map((item) => {
                const active = pathname === item.href;
                if (!item.available) {
                  return (
                    <div
                      key={item.label}
                      className="flex items-center gap-4 p-5 rounded-[28px] text-slate-700 cursor-not-allowed whitespace-nowrap"
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {isSidebarOpen && (
                        <span className="flex-1 flex items-center justify-between">
                          <span className="font-bold text-[13px] tracking-tight">{item.label}</span>
                          <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/5 text-slate-600">Bientôt</span>
                        </span>
                      )}
                    </div>
                  );
                }
                return (
                  <Link
                    key={item.href}
                    href={item.href!}
                    className={`flex items-center gap-4 p-5 rounded-[28px] transition-all duration-500 whitespace-nowrap ${
                      active
                      ? "bg-white/10 border border-white/10 text-white shadow-xl"
                      : "text-slate-500 hover:text-white hover:bg-white/[0.05]"
                    }`}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {isSidebarOpen && <span className="font-bold text-[13px] tracking-tight">{item.label}</span>}
                  </Link>
                );
              })}
            </nav>

            <div className="space-y-3">
               <button
                 onClick={() => setSidebarOpen(!isSidebarOpen)}
                 className="w-full flex items-center gap-4 p-5 rounded-[28px] text-slate-500 hover:text-white hover:bg-white/[0.05] transition-all"
               >
                 <ChevronLeft className={`w-5 h-5 transition-transform duration-500 ${isSidebarOpen ? "" : "rotate-180"}`} />
                 {isSidebarOpen && <span className="font-bold text-[13px]">Réduire</span>}
               </button>
               
               <button
                 onClick={async () => { await logout(); router.push("/login"); }}
                 className="w-full flex items-center gap-4 p-5 rounded-[28px] text-red-400/60 hover:text-red-400 hover:bg-red-500/5 transition-all"
               >
                 <LogOut className="w-5 h-5" />
                 {isSidebarOpen && <span className="font-bold text-[13px]">Quitter</span>}
               </button>
            </div>
         </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-y-auto p-12 scrollbar-hidden">
        <div className="max-w-7xl mx-auto space-y-12 animate-fluid-in">
           {children}
        </div>
      </main>
    </div>
  );
}
