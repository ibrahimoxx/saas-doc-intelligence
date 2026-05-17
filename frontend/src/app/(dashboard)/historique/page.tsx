"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useTenants } from "@/hooks/useTenants";
import { tenantService } from "@/services/tenant.service";
import {
  conversationService,
  type Conversation,
  type Message,
} from "@/services/conversation.service";
import type { TenantMember } from "@/types/tenant.types";
import { TopBar } from "@/components/layout/TopBar";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { Bot, FileText, MessageSquare, Paperclip, User } from "lucide-react";

export default function HistoriquePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const shouldReduceMotion = useReducedMotion();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    tenants,
    selectedTenantId: selectedTenant,
    setSelectedTenantId: setSelectedTenant,
    loading: loadingTenants,
  } = useTenants();

  const currentRole =
    tenants.find((t) => t.tenant.id === selectedTenant)?.role ?? "member";
  const isAdminOrOwner = currentRole === "admin" || currentRole === "owner";
  const isOwner = currentRole === "owner";

  const [roleFilter, setRoleFilter] = useState<"member" | "admin">("member");
  const [members, setMembers] = useState<TenantMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [convList, setConvList] = useState<Conversation[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(false);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [loadingConv, setLoadingConv] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!loadingTenants && !isAdminOrOwner) router.push("/dashboard");
  }, [loadingTenants, isAdminOrOwner, router]);

  useEffect(() => {
    if (!selectedTenant || !isAdminOrOwner) return;
    setLoadingMembers(true);
    setSelectedUserId(null);
    setConvList([]);
    setActiveConv(null);
    tenantService.listMembers(selectedTenant).then((res) => {
      if (res.data) setMembers(res.data);
      setLoadingMembers(false);
    });
  }, [selectedTenant, isAdminOrOwner]);

  useEffect(() => {
    setSelectedUserId(null);
    setConvList([]);
    setActiveConv(null);
    setSelectedConvId(null);
  }, [roleFilter]);

  useEffect(() => {
    if (!selectedTenant || !selectedUserId) return;
    setLoadingConvs(true);
    setActiveConv(null);
    setSelectedConvId(null);
    conversationService
      .history(selectedTenant, { user_id: selectedUserId })
      .then((res) => {
        if (res.data) setConvList(res.data);
        setLoadingConvs(false);
      });
  }, [selectedTenant, selectedUserId]);

  useEffect(() => {
    if (!selectedTenant || !selectedConvId) return;
    setLoadingConv(true);
    conversationService.detail(selectedTenant, selectedConvId).then((res) => {
      if (res.data) setActiveConv(res.data);
      setLoadingConv(false);
    });
  }, [selectedTenant, selectedConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConv?.messages]);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const filteredMembers = members.filter((m) => {
    if (roleFilter === "admin") return m.role === "admin";
    return m.role === "member" || m.role === "manager";
  });

  if (isLoading || (!isAuthenticated && !isLoading)) return <PageLoader />;
  if (!loadingTenants && !isAdminOrOwner) return <PageLoader />;

  return (
    <div className="flex h-screen flex-col bg-bg-base overflow-hidden">
      <TopBar
        userEmail={user?.email}
        isSuperuser={user?.is_superuser}
        tenants={tenants}
        selectedTenantId={selectedTenant}
        onTenantChange={setSelectedTenant}
        onLogout={handleLogout}
        onAdminDashboard={() => router.push("/admin/dashboard")}
      />

      <div className="flex flex-1 overflow-hidden pt-14">
        {/* Panel 1: Users */}
        <div className="w-56 shrink-0 flex flex-col border-r border-border-subtle bg-bg-elevated-1/60 backdrop-blur-sm">
          <div className="p-4 border-b border-border-subtle space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-fg-tertiary">
              Utilisateurs
            </p>
            <div className="flex gap-1 rounded-xl border border-border-subtle bg-bg-base/60 p-1">
              {isOwner && (
                <button
                  onClick={() => setRoleFilter("admin")}
                  className={`flex-1 rounded-lg py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                    roleFilter === "admin"
                      ? "bg-brand-primary/15 text-brand-primary"
                      : "text-fg-tertiary hover:text-fg-secondary"
                  }`}
                >
                  Admins
                </button>
              )}
              <button
                onClick={() => setRoleFilter("member")}
                className={`flex-1 rounded-lg py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                  roleFilter === "member"
                    ? "bg-brand-primary/15 text-brand-primary"
                    : "text-fg-tertiary hover:text-fg-secondary"
                }`}
              >
                Membres
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-0.5 scrollbar-hidden">
            {loadingMembers ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-4 w-4 rounded-full border-2 border-bg-elevated-3 border-t-brand-primary animate-spin" />
              </div>
            ) : filteredMembers.length === 0 ? (
              <p className="px-3 py-8 text-center text-[10px] text-fg-tertiary">
                Aucun utilisateur
              </p>
            ) : (
              filteredMembers.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedUserId(m.user.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors ${
                    selectedUserId === m.user.id
                      ? "bg-brand-primary/10 border border-brand-primary/20"
                      : "border border-transparent hover:bg-bg-elevated-2"
                  }`}
                >
                  <div className="h-7 w-7 shrink-0 rounded-xl bg-bg-elevated-3 flex items-center justify-center">
                    <User className="h-3.5 w-3.5 text-fg-tertiary" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-fg-primary">
                      {m.user.full_name || m.user.email}
                    </p>
                    <p className="text-[10px] text-fg-tertiary capitalize">{m.role}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Panel 2: Conversations */}
        <div className="w-64 shrink-0 flex flex-col border-r border-border-subtle bg-bg-elevated-1/40">
          <div className="p-4 border-b border-border-subtle">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-fg-tertiary">
              Conversations
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5 scrollbar-hidden">
            {!selectedUserId ? (
              <p className="px-3 py-8 text-center text-[10px] text-fg-tertiary">
                Sélectionnez un utilisateur
              </p>
            ) : loadingConvs ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-4 w-4 rounded-full border-2 border-bg-elevated-3 border-t-brand-primary animate-spin" />
              </div>
            ) : convList.length === 0 ? (
              <p className="px-3 py-8 text-center text-[10px] text-fg-tertiary">
                Aucune conversation
              </p>
            ) : (
              convList.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedConvId(c.id)}
                  className={`w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors ${
                    selectedConvId === c.id
                      ? "bg-brand-primary/10 border border-brand-primary/20"
                      : "border border-transparent hover:bg-bg-elevated-2"
                  }`}
                >
                  <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-fg-tertiary" />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-fg-primary">
                      {c.title || "Discussion"}
                    </p>
                    <p className="text-[10px] text-fg-tertiary">
                      {c.message_count || 0} messages
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Panel 3: Read-only thread */}
        <main className="flex-1 flex flex-col overflow-hidden" id="main">
          {!selectedConvId ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center space-y-3">
                <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-[24px] border border-border-subtle bg-bg-elevated-2">
                  <MessageSquare className="h-7 w-7 text-fg-tertiary" />
                </div>
                <p className="text-sm font-semibold text-fg-secondary">
                  Sélectionnez une conversation
                </p>
                <p className="text-xs text-fg-tertiary">
                  Vue en lecture seule — traçabilité
                </p>
              </div>
            </div>
          ) : loadingConv ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-6 w-6 rounded-full border-2 border-bg-elevated-3 border-t-brand-primary animate-spin" />
            </div>
          ) : (
            <>
              <div className="border-b border-border-subtle px-6 py-4">
                <p className="text-sm font-semibold text-fg-primary truncate">
                  {activeConv?.title || "Discussion"}
                </p>
                <p className="text-[10px] text-fg-tertiary mt-0.5">
                  Lecture seule · {activeConv?.messages?.length ?? 0} messages
                </p>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-hidden">
                {(activeConv?.messages ?? []).map((msg) => (
                  <ReadOnlyBubble
                    key={msg.id}
                    msg={msg}
                    shouldReduceMotion={!!shouldReduceMotion}
                  />
                ))}
                <div ref={messagesEndRef} className="h-2" />
              </div>

              <div className="border-t border-border-subtle bg-bg-base/80 px-6 py-3 text-center">
                <p className="text-xs text-fg-tertiary">
                  Vue en lecture seule — traçabilité admin
                </p>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function ReadOnlyBubble({
  msg,
  shouldReduceMotion,
}: {
  msg: Message;
  shouldReduceMotion: boolean;
}) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl ${
          isUser
            ? "border border-border-subtle bg-bg-elevated-2 text-brand-primary"
            : "aurora-bg text-white"
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      <div
        className={`flex max-w-[75%] flex-col gap-3 ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-7 ${
            isUser
              ? "rounded-tr-sm border border-border-subtle bg-bg-elevated-1 text-fg-primary"
              : "rounded-tl-sm border border-brand-primary/15 bg-brand-primary/8 text-fg-secondary"
          }`}
        >
          {msg.content}
        </div>

        {msg.citations && msg.citations.length > 0 && (
          <div className="w-full rounded-2xl border border-border-subtle bg-bg-elevated-1/60 p-4 space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-brand-primary">
              <Paperclip className="h-3.5 w-3.5" />
              Sources vérifiées
            </div>
            <div className="space-y-2">
              {msg.citations.map((cit, i) => (
                <div
                  key={cit.id || i}
                  className="flex items-center gap-3 rounded-xl border border-border-subtle bg-bg-elevated-2/60 px-3 py-2 text-xs"
                >
                  <span className="font-mono text-brand-primary/50">
                    0{i + 1}
                  </span>
                  <span className="flex-1 truncate font-semibold text-fg-secondary">
                    {cit.document_title}
                  </span>
                  <span className="shrink-0 rounded-lg bg-success/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-success">
                    {(cit.similarity * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
