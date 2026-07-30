"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminService, type AdminRecentQuery } from "@/services/admin.service";
import { ArrowLeft, Loader2, Search } from "lucide-react";

export default function AdminActivitesPage() {
  const router = useRouter();

  const [queries, setQueries] = useState<AdminRecentQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    adminService.getRecentQueries(500).then((res) => {
      if (res.data) setQueries(res.data);
      setLoading(false);
    });
  }, []);

  const filtered = queries.filter((q) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      q.question.toLowerCase().includes(s) ||
      q.user_email.toLowerCase().includes(s) ||
      q.tenant_name.toLowerCase().includes(s)
    );
  });

  return (
    <div className="px-8 pb-12 pt-7">
      {/* Header */}
      <div className="mb-[18px]">
        <button
          onClick={() => router.push("/admin/dashboard")}
          className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-fg-tertiary transition-colors hover:text-fg-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Vue d&apos;ensemble
        </button>
        <h1 className="text-[22px] font-bold text-fg-primary">Journal d&apos;activité</h1>
        <p className="mt-1 text-[13px] text-fg-secondary">
          {loading ? "Chargement…" : `${filtered.length} activité${filtered.length === 1 ? "" : "s"}`}{" "}
          — toutes organisations
        </p>
      </div>

      {/* Search */}
      <div className="mb-3.5 max-w-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-tertiary" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrer par question, email, organisation…"
            className="dc-input pl-8"
          />
        </div>
      </div>

      {/* Table */}
      <div className="dc-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-5 w-5 animate-spin text-brand-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-[13px] text-fg-tertiary">
            Aucune activité trouvée
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse">
              <thead>
                <tr>
                  <th className="dc-th text-left">Question</th>
                  <th className="dc-th text-left">Utilisateur</th>
                  <th className="dc-th text-left">Organisation</th>
                  <th className="dc-th text-right">Modèle</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((q) => (
                  <tr key={q.id} className="dc-row">
                    <td className="dc-td max-w-[420px] font-medium text-fg-primary">
                      <span className="block truncate">{q.question}</span>
                    </td>
                    <td className="dc-td">
                      <span className="block max-w-[180px] truncate">{q.user_email}</span>
                    </td>
                    <td className="dc-td">
                      <span className="block max-w-[160px] truncate">{q.tenant_name}</span>
                    </td>
                    <td className="dc-td text-right">
                      <span className="dc-badge font-mono text-[10.5px]">{q.model_used}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
