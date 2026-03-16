// src/app/(dashboard)/chat/page.tsx
"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { tenantService } from "@/services/tenant.service";
import {
  conversationService,
  type Conversation,
  type Message,
} from "@/services/conversation.service";
import type { TenantMembership } from "@/types/tenant.types";
import { TopBar } from "@/components/layout/TopBar";
import {
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
  const { user, isAuthenticated, isLoading, logout } = useAuth();
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

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  useEffect(() => {
    if (isAuthenticated) {
      tenantService.myTenants().then((res) => {
        if (res.data?.length) {
          const memberships = res.data as unknown as TenantMembership[];
          setTenants(memberships);
          setSelectedTenant(memberships[0].tenant.id);
        } else {
          setLoadingConversations(false);
        }
      });
    }
  }, [isAuthenticated]);

  const loadConversations = async (tid: string) => {
    setLoadingConversations(true);
    const res = await conversationService.list(tid);
    if (res.data) setConversations(res.data);
    setLoadingConversations(false);
  };

  useEffect(() => {
    if (selectedTenant) loadConversations(selectedTenant);
  }, [selectedTenant]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages]);

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

  if (isLoading || (!isAuthenticated && !isLoading)) {
    return (
      <div className="h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-10 h-10 border-[3px] border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  const messages = activeConversation?.messages || [];

  return (
    <div className="h-screen flex flex-col text-slate-200 antialiased overflow-hidden">
      <TopBar
        userEmail={user?.email}
        isSuperuser={user?.is_superuser}
        tenants={tenants}
        selectedTenantId={selectedTenant}
        onTenantChange={(id) => setSelectedTenant(id)}
        onLogout={handleLogout}
        onAdminDashboard={() => router.push("/admin/dashboard")}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* ── Sidebar ──────────────────────────── */}
        <aside className="w-[320px] h-full flex flex-col bg-[#131722]/50 border-r border-white/5 backdrop-blur-xl shrink-0 p-6 space-y-8">
          {/* New conversation button */}
          <button
            onClick={startNewChat}
            className="group w-full flex items-center justify-center gap-3 py-4 px-6 rounded-[20px] font-bold text-white transition-all shadow-2xl hover:shadow-indigo-500/20 active:scale-95 bg-gradient-brand"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            <span>Nouveau Chat</span>
          </button>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-hide">
            {conversations.map((c) => (
              <div
                key={c.id}
                onClick={() => openConversation(c.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") { openConversation(c.id); }
                }}
                className={`w-full group flex items-start gap-4 p-4 rounded-[20px] transition-all duration-300 cursor-pointer ${
                  activeConversation?.id === c.id
                    ? "bg-white/[0.08] border border-white/10 shadow-lg"
                    : "hover:bg-white/[0.03] border border-transparent"
                }`}
              >
                <div className={`mt-1 p-2 rounded-[12px] flex-shrink-0 transition-colors ${
                  activeConversation?.id === c.id ? "bg-indigo-500/10 text-indigo-400" : "bg-white/5 text-slate-500"
                }`}>
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className={`font-bold truncate text-[13px] ${activeConversation?.id === c.id ? "text-white" : "text-slate-300"}`}>
                    {c.title || "Sans titre"}
                  </div>
                  <div className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                    {c.message_count || 0} MESSAGES
                  </div>
                </div>
                <button
                  onClick={(e) => deleteConversation(c.id, e)}
                  className="opacity-0 group-hover:opacity-50 hover:!opacity-100 hover:text-red-400 p-1.5 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {conversations.length === 0 && !loadingConversations && (
              <div className="text-center py-20 px-8">
                <p className="text-slate-600 text-[10px] font-black tracking-widest uppercase">Aucune discussion</p>
              </div>
            )}
          </div>
        </aside>

        {/* ── Main Chat Area ───────────────────── */}
        <main className="flex-1 flex flex-col h-full relative overflow-hidden">
          {/* Scrollable Message Container */}
          <div className="flex-1 overflow-y-auto px-6 py-10 space-y-10">
            {!activeConversation && messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-8 animate-fade-in">
                <div className="w-24 h-24 rounded-[32px] bg-gradient-brand flex items-center justify-center shadow-2xl shadow-indigo-500/30">
                  <Bot className="w-12 h-12 text-white" />
                </div>
                <div className="space-y-3">
                  <h2 className="text-4xl font-bold font-heading tracking-tight">DocPilot AI Engine</h2>
                  <p className="text-slate-400 text-lg leading-relaxed">
                    Posez vos questions techniques ou demandez une analyse documentaire. L'IA extrait les réponses directement de votre base de connaissances.
                  </p>
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"} animate-fade-in`}
              >
                <div className={`w-12 h-12 rounded-[18px] flex items-center justify-center shrink-0 border shadow-lg ${
                  msg.role === "user" 
                  ? "bg-white/5 border-white/10 text-indigo-400" 
                  : "bg-indigo-500/10 border-indigo-500/20 text-fuchsia-400"
                }`}>
                  {msg.role === "user" ? <User className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
                </div>

                <div className={`flex flex-col gap-4 max-w-[70%] ${msg.role === "user" ? "items-end text-right" : "items-start"}`}>
                  <div
                    className={`p-6 rounded-[24px] text-base leading-relaxed shadow-2xl ${
                      msg.role === "user"
                        ? "bg-gradient-brand text-white rounded-tr-[4px]"
                        : "bg-[#131722]/80 backdrop-blur-md border border-white/5 text-slate-200 rounded-tl-[4px]"
                    }`}
                  >
                    {msg.content}
                  </div>

                  {/* Citations View 1:1 Stitch */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="w-full bg-white/[0.03] border border-white/5 rounded-[20px] p-5 space-y-3">
                      <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-indigo-400 uppercase">
                        <Paperclip className="w-4 h-4" />
                        <span>Sources Documentaires</span>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {msg.citations.map((cit, i) => (
                          <div key={cit.id || i} className="flex items-center gap-3 p-3 rounded-[12px] bg-white/[0.02] border border-white/5 text-xs text-slate-300">
                            <span className="font-black text-indigo-500">[{i + 1}]</span>
                            <span className="truncate flex-1 font-medium">{cit.document_title}</span>
                            <span className="text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md text-[9px] tracking-widest uppercase">
                              {Math.round(cit.similarity * 100)}% Match
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex gap-4 animate-fade-in">
                <div className="w-12 h-12 rounded-[18px] bg-indigo-500/10 border border-indigo-500/20 text-fuchsia-400 flex items-center justify-center">
                  <Bot className="w-6 h-6" />
                </div>
                <div className="p-6 rounded-[24px] rounded-tl-[4px] bg-[#131722]/80 border border-white/5 flex gap-2 items-center">
                   {[0, 2, 4].map(i => (
                     <div key={i} className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: `${i*200}ms` }} />
                   ))}
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} className="h-4" />
          </div>

          {/* Input Area Stitch Precision */}
          <div className="p-8 border-t border-white/5 bg-[#131722]/40 backdrop-blur-xl">
             <div className="max-w-4xl mx-auto relative group">
                <div className="absolute -inset-0.5 bg-gradient-brand opacity-10 group-focus-within:opacity-30 blur-xl transition-opacity pointer-events-none rounded-[24px]" />
                <div className="relative flex items-center">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Posez votre question à DocPilot AI..."
                    rows={1}
                    className="w-full bg-[#1e2330]/80 border border-white/10 rounded-[24px] py-6 pl-8 pr-20 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 shadow-2xl transition-all resize-none min-h-[72px] max-h-48 overflow-y-auto"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || sending}
                    className="absolute right-4 p-4 rounded-[18px] text-white bg-gradient-brand shadow-xl opacity-90 hover:opacity-100 disabled:opacity-30 active:scale-95 transition-all"
                  >
                    <Send className="w-5 h-5 flex-shrink-0" />
                  </button>
                </div>
             </div>
          </div>
        </main>
      </div>

      <style jsx global>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.4s ease-out forwards; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-10 h-10 border-[3px] border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
