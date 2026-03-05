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
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 md:min-h-screen flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-800 shrink-0">
          <ShieldCheckIcon className="w-6 h-6 text-indigo-400 mr-2" />
          <span className="font-semibold text-white tracking-wide">
            Admin Panel
          </span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          <Link
            href="/admin/dashboard"
            className="flex items-center space-x-3 px-3 py-2.5 rounded-lg bg-slate-800 text-white font-medium"
          >
            <ChartBarIcon className="w-5 h-5 flex-shrink-0" />
            <span>Platform Stats</span>
          </Link>
          
          <Link
            href="/dashboard"
            className="flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
          >
            <HomeIcon className="w-5 h-5 flex-shrink-0" />
            <span>App Dashboard</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center px-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400 font-bold text-sm shrink-0">
              {user.email.charAt(0).toUpperCase()}
            </div>
            <div className="ml-3 truncate">
              <p className="text-sm font-medium text-white truncate">
                {user.email}
              </p>
              <p className="text-xs text-slate-400">Superuser</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="flex w-full items-center space-x-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <ArrowLeftOnRectangleIcon className="w-5 h-5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50">
        <div className="flex-1 overflow-y-auto w-full max-w-7xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
