"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { tenantService } from "@/services/tenant.service";
import type { TenantMembership } from "@/types/tenant.types";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [tenants, setTenants] = useState<TenantMembership[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [loadingTenants, setLoadingTenants] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadTenants();
    }
  }, [isAuthenticated]);

  const loadTenants = async () => {
    const res = await tenantService.myTenants();
    if (res.data) {
      setTenants(res.data as unknown as TenantMembership[]);
      // Auto-select first tenant
      if (Array.isArray(res.data) && res.data.length > 0) {
        setSelectedTenant((res.data[0] as unknown as TenantMembership).tenant.id);
      }
    }
    setLoadingTenants(false);
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loader" />
        <style jsx>{`
          .loading-screen {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #0f172a;
          }
          .loader {
            width: 40px;
            height: 40px;
            border: 3px solid rgba(99, 102, 241, 0.2);
            border-top-color: #6366f1;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const currentTenant = tenants.find(m => m.tenant.id === selectedTenant);

  return (
    <div className="dashboard">
      {/* Top bar */}
      <header className="topbar">
        <div className="topbar-left">
          <h1 className="brand">DocPilot AI</h1>

          {/* Tenant selector */}
          {tenants.length > 0 && (
            <select
              className="tenant-select"
              value={selectedTenant || ""}
              onChange={(e) => setSelectedTenant(e.target.value)}
            >
              {tenants.map((m) => (
                <option key={m.tenant.id} value={m.tenant.id}>
                  {m.tenant.name} ({m.role})
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="topbar-right">
          <span className="user-email">{user?.email}</span>
          <button onClick={handleLogout} className="logout-btn">
            Déconnexion
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="main-content">
        <div className="welcome-card">
          <h2>Bienvenue, {user?.full_name} 👋</h2>
          <p>
            {currentTenant
              ? `Organisation : ${currentTenant.tenant.name} — Rôle : ${currentTenant.role}`
              : "Aucune organisation trouvée."}
          </p>
        </div>

        <div className="stats-grid">
          <div className="stat-card clickable" onClick={() => router.push("/documents")}>
            <div className="stat-icon">📄</div>
            <div className="stat-label">Documents</div>
            <div className="stat-value">—</div>
          </div>
          <div className="stat-card clickable" onClick={() => router.push("/chat")}>
            <div className="stat-icon">💬</div>
            <div className="stat-label">Conversations</div>
            <div className="stat-value">—</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-label">Membres</div>
            <div className="stat-value">{tenants.length > 0 ? "—" : "0"}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📚</div>
            <div className="stat-label">Espaces</div>
            <div className="stat-value">—</div>
          </div>
        </div>

        <p className="coming-soon">🚧 Les fonctionnalités seront ajoutées dans les prochaines phases.</p>
      </main>

      <style jsx>{`
        .dashboard {
          min-height: 100vh;
          background: #0f172a;
          color: #e2e8f0;
        }

        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 2rem;
          background: rgba(30, 27, 75, 0.5);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(99, 102, 241, 0.15);
        }

        .topbar-left {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .brand {
          font-size: 1.2rem;
          font-weight: 700;
          background: linear-gradient(135deg, #6366f1, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .tenant-select {
          padding: 0.4rem 0.8rem;
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 8px;
          color: #e2e8f0;
          font-size: 0.85rem;
          outline: none;
        }

        .tenant-select:focus {
          border-color: #6366f1;
        }

        .topbar-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .user-email {
          color: #94a3b8;
          font-size: 0.85rem;
        }

        .logout-btn {
          padding: 0.4rem 1rem;
          background: transparent;
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          color: #fca5a5;
          font-size: 0.85rem;
          cursor: pointer;
          transition: background 0.2s;
        }

        .logout-btn:hover {
          background: rgba(239, 68, 68, 0.1);
        }

        .main-content {
          max-width: 960px;
          margin: 0 auto;
          padding: 2.5rem 2rem;
        }

        .welcome-card {
          background: rgba(30, 27, 75, 0.4);
          border: 1px solid rgba(99, 102, 241, 0.15);
          border-radius: 16px;
          padding: 2rem;
          margin-bottom: 2rem;
        }

        .welcome-card h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .welcome-card p {
          color: #94a3b8;
          font-size: 0.95rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: rgba(30, 27, 75, 0.3);
          border: 1px solid rgba(99, 102, 241, 0.1);
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
          transition: border-color 0.2s;
        }

        .stat-card:hover {
          border-color: rgba(99, 102, 241, 0.3);
        }

        .stat-card.clickable {
          cursor: pointer;
        }

        .stat-card.clickable:hover {
          border-color: #6366f1;
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(99, 102, 241, 0.15);
        }

        .stat-icon {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
        }

        .stat-label {
          color: #94a3b8;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.25rem;
        }

        .stat-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: #a5b4fc;
        }

        .coming-soon {
          text-align: center;
          color: #64748b;
          font-size: 0.9rem;
          padding: 2rem;
        }
      `}</style>
    </div>
  );
}
