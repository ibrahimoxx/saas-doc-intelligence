"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTenants } from "@/hooks/useTenants";
import { tenantService } from "@/services/tenant.service";
import {
  conversationService,
  type Conversation,
  type Message,
} from "@/services/conversation.service";
import type { TenantMember } from "@/types/tenant.types";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { Bot, FileText, Loader2, MessageSquare, Paperclip, User } from "lucide-react";

export default function HistoriquePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    tenants,
    selectedTenantId: selectedTenant,
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

  const filteredMembers = members.filter((m) => {
    if (roleFilter === "admin") return m.role === "admin";
    return m.role === "member" || m.role === "manager";
  });

  if (isLoading || (!isAuthenticated && !isLoading)) return <PageLoader />;
  if (!loadingTenants && !isAdminOrOwner) return <PageLoader />;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        {/* Panel 1: Users */}
        <div className="flex w-56 shrink-0 flex-col border-r border-border-subtle bg-bg-sidebar">
          <div className="space-y-2.5 border-b border-border-subtle p-3">
            <p className="dc-label">Utilisateurs</p>
            <div className="flex gap-1 rounded-md border border-border-subtle bg-bg-base p-1">
              {isOwner && (
                <button
                  onClick={() => setRoleFilter("admin")}
                  className={`flex-1 rounded-[5px] py-1.5 text-[11px] font-semibold transition-colors ${
                    roleFilter === "admin"
                      ? "bg-brand-soft text-brand-primary"
                      : "text-fg-tertiary hover:text-fg-primary"
                  }`}
                >
                  Admins
                </button>
              )}
              <button
                onClick={() => setRoleFilter("member")}
                className={`flex-1 rounded-[5px] py-1.5 text-[11px] font-semibold transition-colors ${
                  roleFilter === "member"
                    ? "bg-brand-soft text-brand-primary"
                    : "text-fg-tertiary hover:text-fg-primary"
                }`}
              >
                Membres
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-0.5 overflow-y-auto p-2">
            {loadingMembers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-4 w-4 animate-spin text-brand-primary" />
              </div>
            ) : filteredMembers.length === 0 ? (
              <p className="px-3 py-8 text-center text-[12px] text-fg-tertiary">
                Aucun utilisateur
              </p>
            ) : (
              filteredMembers.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedUserId(m.user.id)}
                  className={`flex w-full items-center gap-2.5 rounded-[7px] px-2.5 py-2 text-left transition-colors ${
                    selectedUserId === m.user.id ? "bg-brand-soft" : "hover:bg-bg-elevated-1"
                  }`}
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border-subtle bg-bg-elevated-1">
                    <User className="h-3.5 w-3.5 text-fg-tertiary" />
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`truncate text-[12.5px] font-semibold ${
                        selectedUserId === m.user.id ? "text-brand-primary" : "text-fg-primary"
                      }`}
                    >
                      {m.user.full_name || m.user.email}
                    </p>
                    <p className="text-[11px] capitalize text-fg-tertiary">{m.role}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Panel 2: Conversations */}
        <div className="flex w-64 shrink-0 flex-col border-r border-border-subtle bg-bg-sidebar">
          <div className="border-b border-border-subtle p-3">
            <p className="dc-label">Conversations</p>
          </div>
          <div className="flex-1 space-y-0.5 overflow-y-auto p-2">
            {!selectedUserId ? (
              <p className="px-3 py-8 text-center text-[12px] text-fg-tertiary">
                Sélectionnez un utilisateur
              </p>
            ) : loadingConvs ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-4 w-4 animate-spin text-brand-primary" />
              </div>
            ) : convList.length === 0 ? (
              <p className="px-3 py-8 text-center text-[12px] text-fg-tertiary">
                Aucune conversation
              </p>
            ) : (
              convList.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedConvId(c.id)}
                  className={`flex w-full items-start gap-2.5 rounded-[7px] px-2.5 py-2 text-left transition-colors ${
                    selectedConvId === c.id ? "bg-brand-soft" : "hover:bg-bg-elevated-1"
                  }`}
                >
                  <FileText className="mt-px h-3.5 w-3.5 shrink-0 text-fg-tertiary" />
                  <div className="min-w-0">
                    <p
                      className={`truncate text-[12.5px] font-semibold ${
                        selectedConvId === c.id ? "text-brand-primary" : "text-fg-primary"
                      }`}
                    >
                      {c.title || "Discussion"}
                    </p>
                    <p className="text-[11px] text-fg-tertiary">
                      {c.message_count || 0} messages
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Panel 3: Read-only thread */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {!selectedConvId ? (
            <div className="flex h-full items-center justify-center">
              <div className="space-y-2 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg border border-border-subtle bg-bg-elevated-1">
                  <MessageSquare className="h-5 w-5 text-fg-tertiary" />
                </div>
                <p className="text-[13.5px] font-semibold text-fg-primary">
                  Sélectionnez une conversation
                </p>
                <p className="text-[12px] text-fg-tertiary">
                  Vue en lecture seule — traçabilité
                </p>
              </div>
            </div>
          ) : loadingConv ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-brand-primary" />
            </div>
          ) : (
            <>
              <div className="border-b border-border-subtle px-6 py-3.5">
                <p className="truncate text-[13.5px] font-semibold text-fg-primary">
                  {activeConv?.title || "Discussion"}
                </p>
                <p className="mt-0.5 text-[11.5px] text-fg-tertiary">
                  Lecture seule · {activeConv?.messages?.length ?? 0} messages
                </p>
              </div>

              <div className="flex-1 overflow-y-auto px-8 py-6">
                <div className="mx-auto flex w-full max-w-[760px] flex-col gap-[18px]">
                  {(activeConv?.messages ?? []).map((msg) => (
                    <ReadOnlyBubble key={msg.id} msg={msg} />
                  ))}
                  <div ref={messagesEndRef} className="h-2" />
                </div>
              </div>

              <div className="border-t border-border-subtle px-6 py-2.5 text-center">
                <p className="text-[11px] text-fg-tertiary">
                  Vue en lecture seule — traçabilité admin
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ReadOnlyBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";

  return (
    <div className="flex gap-3">
      {isUser ? (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] border border-border-subtle bg-bg-elevated-1 text-fg-secondary">
          <User className="h-3.5 w-3.5" />
        </div>
      ) : (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] bg-fg-primary">
          <Bot className="h-3.5 w-3.5 text-bg-base" />
        </div>
      )}

      <div className={`min-w-0 ${isUser ? "max-w-[520px]" : "flex-1"}`}>
        <div className="dc-card px-3.5 py-3 text-[13.5px] leading-relaxed text-fg-primary">
          {msg.content}
        </div>

        {msg.citations && msg.citations.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {msg.citations.map((cit, i) => (
              <span
                key={cit.id || i}
                className="inline-flex items-center gap-1.5 rounded-md border border-border-subtle bg-bg-elevated-1 px-2.5 py-1 text-[11px] font-semibold text-fg-primary"
              >
                <Paperclip className="h-3 w-3 shrink-0 text-fg-tertiary" />
                <span className="max-w-[240px] truncate">{cit.document_title}</span>
                <span className="text-fg-tertiary">· {(cit.similarity * 100).toFixed(0)}%</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
