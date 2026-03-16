// src/app/admin/layout.tsx
"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  LogOut,
  LayoutDashboard,
  BarChart4
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();

  // Protect admin routes
  useEffect(() => {
    if (!isLoading && (!user || !user.is_superuser)) {
        router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || !user.is_superuser) {
    return (
      <div className="bg-[#020617] h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-[3px] border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col md:flex-row antialiased">
      {/* Background Atmosphere Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="bg-blob bg-indigo-500/5 top-[-10%] left-[-10%] w-[40%] h-[40%]" />
        <div className="bg-blob bg-purple-500/5 bottom-[-10%] right-[-10%] w-[40%] h-[40%]" />
      </div>

      {/* Admin Sidebar */}
      <aside className="w-full md:w-80 h-full flex flex-col bg-[#131722]/50 border-r border-white/5 backdrop-blur-3xl md:h-screen shrink-0 z-50 p-6 space-y-8">
        <div className="flex items-center gap-4 px-2">
          <div className="w-12 h-12 rounded-[18px] bg-gradient-brand flex items-center justify-center shadow-2xl shadow-indigo-500/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xl tracking-tighter text-white">DOCPILOT</span>
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">Admin Console</span>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-4 px-6 py-4 rounded-[20px] bg-white/[0.08] text-white border border-white/10 shadow-lg group transition-all"
          >
            <BarChart4 className="w-5 h-5 text-indigo-400" />
            <span className="font-bold">Vue d'ensemble</span>
          </Link>
          
          <Link
            href="/dashboard"
            className="flex items-center gap-4 px-6 py-4 rounded-[20px] text-slate-400 hover:bg-white/[0.03] hover:text-white border border-transparent hover:border-white/5 transition-all group"
          >
            <LayoutDashboard className="w-5 h-5 group-hover:text-indigo-400 transition-colors" />
            <span className="font-bold">Application</span>
          </Link>
        </nav>

        {/* User Card */}
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 rounded-[24px] bg-[#1e2330]/50 border border-white/5">
             <div className="w-12 h-12 rounded-[18px] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-300 font-black">
                {user.email.charAt(0).toUpperCase()}
             </div>
             <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white truncate">{user.email.split("@")[0]}</p>
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                   <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Superuser</span>
                </div>
             </div>
          </div>

          <button
            onClick={() => logout()}
            className="group w-full flex items-center justify-center gap-3 py-4 rounded-[20px] bg-red-500/10 border border-red-500/20 text-red-400 font-bold transition-all hover:bg-red-500/20 active:scale-95"
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Content */}
      <main className="flex-1 overflow-y-auto relative z-10 w-full h-full max-w-7xl mx-auto px-8 py-16 md:px-12 md:py-20 scrollbar-hide">
        {children}
      </main>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
