"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { tenantService } from "@/services/tenant.service";
import {
  conversationService,
  type Conversation,
  type Message,
} from "@/services/conversation.service";
import type { TenantMembership } from "@/types/tenant.types";
import { Suspense } from "react";
import {
  ArrowLeft,
  Plus,
  Trash2,
  FileText,
  Bot,
  User,
  Send,
  Paperclip,
} from "lucide-react";

function ChatContent() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [tenants, setTenants] = useState<TenantMembership[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) loadTenants();
  }, [isAuthenticated]);

  useEffect(() => {
    if (selectedTenant) loadConversations();
  }, [selectedTenant]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages]);

  const loadTenants = async () => {
    const res = await tenantService.myTenants();
    if (res.data && Array.isArray(res.data) && res.data.length > 0) {
      const memberships = res.data as unknown as TenantMembership[];
      setTenants(memberships);
      setSelectedTenant(memberships[0].tenant.id);
    } else {
      setLoadingConversations(false);
    }
  };

  const loadConversations = async () => {
    if (!selectedTenant) return;
    setLoadingConversations(true);
    const res = await conversationService.list(selectedTenant);
    if (res.data) setConversations(res.data);
    setLoadingConversations(false);
  };

  const openConversation = async (convId: string) => {
    if (!selectedTenant) return;
    const res = await conversationService.detail(selectedTenant, convId);
    if (res.data) setActiveConversation(res.data);
  };

  const handleSend = async () => {
    if (!input.trim() || sending || !selectedTenant) return;
    const question = input;
    setInput("");
    setSending(true);
    setError("");

    if (activeConversation) {
      const tempUserMsg: Message = {
        id: "temp-" + Date.now(),
        role: "user",
        content: question,
        model_name: "",
        total_tokens: 0,
        latency_ms: 0,
        citations: [],
        created_at: new Date().toISOString(),
      };
      setActiveConversation((prev) =>
        prev ? { ...prev, messages: [...(prev.messages || []), tempUserMsg] } : prev
      );

      const res = await conversationService.sendMessage(selectedTenant, activeConversation.id, question);
      if (res.data) {
        setActiveConversation((prev) => {
          if (!prev) return prev;
          const msgs = (prev.messages || []).filter((m) => m.id !== tempUserMsg.id);
          return { ...prev, messages: [...msgs, res.data!.user_message, res.data!.assistant_message] };
        });
      } else {
        setError(res.error?.message || "Erreur lors de l'envoi du message.");
      }
    } else {
      const res = await conversationService.create(selectedTenant, { first_message: question });
      if (res.data) {
        setActiveConversation(res.data);
        setConversations((prev) => [res.data!, ...prev]);
      } else {
        setError(res.error?.message || "Erreur lors de la création de la conversation.");
      }
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const startNewChat = () => { setActiveConversation(null); setInput(""); setError(""); };

  const deleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedTenant) return;
    if (!confirm("Supprimer cette conversation ?")) return;
    await conversationService.archive(selectedTenant, convId);
    setConversations((prev) => prev.filter((c) => c.id !== convId));
    if (activeConversation?.id === convId) setActiveConversation(null);
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;
  const messages = activeConversation?.messages || [];

  return (
    <div
      className="h-screen w-screen overflow-hidden flex text-sm"
      style={{ background: "radial-gradient(circle at center, #151623 0%, #0a0a0f 100%)" }}
    >
      {/* ── Sidebar ──────────────────────────── */}
      <aside className="w-[280px] h-full flex flex-col border-r border-slate-800 bg-[#0c0f1a]/80 p-4 shrink-0">
        {/* Back link */}
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Retour au dashboard
        </button>

        {/* New conversation button */}
        <button
          onClick={startNewChat}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-white mb-6 hover:opacity-90 transition-opacity shadow-lg shadow-indigo-500/20"
          style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }}
        >
          <Plus className="w-4 h-4" />
          Nouveau
        </button>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => openConversation(c.id)}
              className={`w-full text-left flex items-start gap-3 p-3 rounded-xl transition-colors group ${
                activeConversation?.id === c.id
                  ? "text-white"
                  : "text-slate-400 hover:bg-slate-800/30"
              }`}
              style={
                activeConversation?.id === c.id
                  ? { background: "rgba(255,255,255,0.08)" }
                  : {}
              }
            >
              <div className={`mt-0.5 p-1.5 rounded-lg flex-shrink-0 ${
                activeConversation?.id === c.id ? "bg-slate-700/50 text-indigo-400" : "bg-slate-800/50 text-slate-400"
              }`}>
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate text-sm">{c.title || "Sans titre"}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {c.message_count || 0} msg · {new Date(c.updated_at).toLocaleDateString("fr-FR")}
                </div>
              </div>
              <button
                onClick={(e) => deleteConversation(c.id, e)}
                className="opacity-0 group-hover:opacity-70 hover:!opacity-100 hover:text-red-400 p-1 rounded transition-all"
                title="Supprimer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </button>
          ))}
          {conversations.length === 0 && !loadingConversations && (
            <p className="text-center text-slate-500 text-xs py-8 px-2">
              Aucune conversation. Posez une question !
            </p>
          )}
        </div>
      </aside>

      {/* ── Main Chat Area ───────────────────── */}
      <main className="flex-1 flex flex-col h-full p-6">
        <header className="mb-6 shrink-0">
          <h1 className="text-2xl font-extrabold text-white tracking-tight font-heading">
            DocPilot AI Chat
          </h1>
        </header>

        {/* Chat container */}
        <section
          className="flex-1 flex flex-col rounded-2xl overflow-hidden shadow-2xl"
          style={{
            background: "rgba(30, 32, 45, 0.4)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col">
            {messages.length === 0 && !activeConversation && (
              <div className="flex flex-col items-center justify-center flex-1 text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center mb-4">
                  <Bot className="w-8 h-8 text-fuchsia-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2 font-heading">DocPilot AI</h2>
                <p className="text-slate-400 text-sm max-w-sm">
                  Posez une question sur vos documents. L&apos;IA répondra avec des citations sourcées.
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"} max-w-[85%] ${msg.role === "user" ? "self-end" : "self-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-10 h-10 rounded-full bg-fuchsia-500/20 border border-fuchsia-500/30 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-5 h-5 text-fuchsia-400" />
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <div
                    className={`px-5 py-3.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "text-white rounded-br-sm shadow-md"
                        : "text-slate-200 rounded-bl-sm shadow-md border border-slate-700/50"
                    }`}
                    style={
                      msg.role === "user"
                        ? { background: "linear-gradient(135deg, #6366f1, #a855f7)" }
                        : { background: "rgba(30,41,59,0.8)" }
                    }
                  >
                    {msg.content}
                  </div>

                  {/* Citations */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div
                      className="rounded-xl p-4"
                      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      <div className="flex items-center gap-2 mb-2 text-white text-xs font-semibold">
                        <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                        Citations
                      </div>
                      <ul className="space-y-1">
                        {msg.citations.map((cit, i) => (
                          <li key={cit.id || i} className="text-xs text-indigo-300 flex items-center gap-2">
                            <span className="text-indigo-500 font-bold">[{i + 1}]</span>
                            <span className="truncate">{cit.document_title}</span>
                            {cit.page_number && <span className="text-slate-500">p.{cit.page_number}</span>}
                            <span className="text-emerald-400 font-semibold ml-auto">
                              {Math.round(cit.similarity * 100)}%
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {msg.latency_ms > 0 && (
                    <p className="text-[10px] text-slate-600 px-1">
                      {msg.model_name} · {msg.total_tokens} tokens · {msg.latency_ms}ms
                    </p>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-indigo-300" />
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {sending && (
              <div className="flex items-start gap-3 self-start">
                <div className="w-10 h-10 rounded-full bg-fuchsia-500/20 border border-fuchsia-500/30 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 text-fuchsia-400" />
                </div>
                <div
                  className="px-5 py-4 rounded-2xl rounded-bl-sm flex gap-1.5 items-center"
                  style={{ background: "rgba(30,41,59,0.8)", border: "1px solid rgba(71,85,105,0.5)" }}
                >
                  {[0, 200, 400].map((delay) => (
                    <span
                      key={delay}
                      className="w-2 h-2 rounded-full bg-indigo-500"
                      style={{ animation: `bounce-dot 1.4s ${delay}ms infinite ease-in-out` }}
                    />
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                ⚠️ {error}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            className="p-4 border-t border-slate-800/50 shrink-0"
            style={{ background: "rgba(22,27,44,0.8)", backdropFilter: "blur(8px)" }}
          >
            <div className="relative max-w-5xl mx-auto">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Posez votre question sur vos documents…"
                rows={1}
                disabled={sending}
                className="w-full py-3.5 pl-4 pr-14 text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-none overflow-hidden text-sm transition-all"
                style={{
                  background: "rgba(0,0,0,0.2)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="absolute right-2 bottom-2 p-2 rounded-lg text-white hover:opacity-90 transition-opacity shadow-sm disabled:opacity-30"
                style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }}
              >
                <Send className="w-4 h-4 translate-x-[1px]" />
              </button>
            </div>
          </div>
        </section>
      </main>

      <style>{`
        @keyframes bounce-dot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
