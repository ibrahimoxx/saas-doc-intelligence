"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { 
  ShieldCheckIcon, 
  ArrowLeftOnRectangleIcon,
  HomeIcon,
  ChartBarIcon
} from "@heroicons/react/24/outline";

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
      <div className="flex items-center justify-center min-h-screen bg-[#0f172a]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col md:flex-row font-sans selection:bg-indigo-500/30">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-72 bg-[#020617]/80 backdrop-blur-xl border-r border-slate-800 md:min-h-screen flex flex-col shrink-0 z-50">
        <div className="h-20 flex items-center px-8 border-b border-slate-800/50 shrink-0">
          <div className="flex items-center space-x-3 group cursor-default">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-300">
              <ShieldCheckIcon className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              DocPilot Admin
            </span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2.5">
          <Link
            href="/admin/dashboard"
            className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-indigo-500/10 text-indigo-400 font-semibold border border-indigo-500/20 shadow-inner group transition-all"
          >
            <ChartBarIcon className="w-5 h-5 flex-shrink-0 animate-pulse" />
            <span>Platform Stats</span>
          </Link>
          
          <Link
            href="/dashboard"
            className="flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800/40 hover:text-white hover:border-slate-700 border border-transparent transition-all duration-300 group"
          >
            <div className="p-1.5 rounded-lg bg-slate-800 group-hover:bg-slate-700 transition-colors">
              <HomeIcon className="w-4 h-4 flex-shrink-0" />
            </div>
            <span className="text-sm font-medium">App Dashboard</span>
          </Link>
        </nav>

        <div className="p-6 border-t border-slate-800/50">
          <div className="flex items-center p-3 rounded-2xl bg-white/5 border border-white/5 mb-6 group hover:border-indigo-500/30 transition-all duration-300">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-lg shrink-0 shadow-lg group-hover:scale-105 transition-transform">
              {user.email.charAt(0).toUpperCase()}
            </div>
            <div className="ml-4 truncate">
              <p className="text-sm font-semibold text-white truncate">
                {user.email.split("@")[0]}
              </p>
              <div className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <p className="text-[10px] uppercase tracking-widest font-bold text-indigo-400/80">Superuser</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="flex w-full items-center justify-center space-x-2 px-4 py-3 rounded-xl text-red-400 font-semibold bg-red-400/5 hover:bg-red-400/10 border border-red-500/10 hover:border-red-500/30 transition-all duration-300 active:scale-95"
          >
            <ArrowLeftOnRectangleIcon className="w-5 h-5 text-red-400/70" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0f172a] relative overflow-hidden">
        {/* Decorative background blur */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="flex-1 overflow-y-auto w-full h-full max-w-7xl mx-auto px-6 py-10 md:px-12 md:py-12 z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
