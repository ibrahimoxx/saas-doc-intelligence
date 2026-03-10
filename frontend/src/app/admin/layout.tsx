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
    <div className="min-h-screen bg-[#0f172a] text-[#e2e8f0] flex flex-col md:flex-row font-sans">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 bg-[rgba(30,27,75,0.3)] backdrop-blur-md border-r border-indigo-500/10 md:min-h-screen flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-indigo-500/10 shrink-0">
          <ShieldCheckIcon className="w-6 h-6 text-indigo-400 mr-2" />
          <span className="font-semibold text-white tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
            DocPilot Admin
          </span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <Link
            href="/admin/dashboard"
            className="flex items-center space-x-3 px-3 py-2.5 rounded-lg bg-indigo-500/20 text-indigo-300 font-medium border border-indigo-500/20"
          >
            <ChartBarIcon className="w-5 h-5 flex-shrink-0" />
            <span>Platform Stats</span>
          </Link>
          
          <Link
            href="/dashboard"
            className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-white hover:border-slate-700 border border-transparent transition-all"
          >
            <HomeIcon className="w-5 h-5 flex-shrink-0" />
            <span>App Dashboard</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-indigo-500/10">
          <div className="flex items-center px-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-sm shrink-0">
              {user.email.charAt(0).toUpperCase()}
            </div>
            <div className="ml-3 truncate">
              <p className="text-sm font-medium text-[#e2e8f0] truncate">
                {user.email}
              </p>
              <p className="text-xs text-indigo-400/80">Superuser</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="flex w-full items-center space-x-3 px-3 py-2 rounded-lg text-red-400/80 hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/20 transition-all"
          >
            <ArrowLeftOnRectangleIcon className="w-5 h-5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0f172a] relative overflow-hidden">
        {/* Decorative background blur */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="flex-1 overflow-y-auto w-full max-w-7xl mx-auto p-4 md:p-8 z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
