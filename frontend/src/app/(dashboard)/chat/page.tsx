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
  ChevronLeft,
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
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
    setSending(true);
    setInput("");
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
        setError(res.error?.message || "Erreur lors de l'envoi.");
      }
    } else {
      const res = await conversationService.create(selectedTenant, { first_message: question });
      if (res.data) {
        setActiveConversation(res.data);
        setConversations((prev) => [res.data!, ...prev]);
      } else {
        setError(res.error?.message || "Erreur fatale.");
      }
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const deleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedTenant || !confirm("Supprimer l'historique ?")) return;
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

  return (
    <div className="h-screen flex flex-col bg-transparent overflow-hidden">
      <TopBar
        userEmail={user?.email}
        isSuperuser={user?.is_superuser}
        tenants={tenants}
        selectedTenantId={selectedTenant}
        onTenantChange={setSelectedTenant}
        onLogout={handleLogout}
        onAdminDashboard={() => router.push("/admin/dashboard")}
      />

      <div className="flex-1 flex overflow-hidden pt-28 px-6 pb-6 gap-6">
        {/* ── Sidebar (Glass Island) ──────────────────────────── */}
        <aside className={`flex flex-col bg-white/[0.03] backdrop-blur-3xl border border-white/5 rounded-[40px] transition-all duration-700 overflow-hidden ${sidebarOpen ? "w-80" : "w-0 p-0 opacity-0"}`}>
           <div className="p-8 space-y-8 flex flex-col h-full">
              <button
                onClick={() => { setActiveConversation(null); setInput(""); }}
                className="btn-magnetic w-full py-4 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Nouveau Chat</span>
              </button>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hidden">
                 {conversations.map((c) => (
                   <div
                     key={c.id}
                     onClick={() => openConversation(c.id)}
                     className={`w-full group flex items-start gap-4 p-5 rounded-[28px] transition-all duration-500 cursor-pointer ${
                       activeConversation?.id === c.id
                         ? "bg-white/10 border-white/10 shadow-xl"
                         : "hover:bg-white/[0.05] border border-transparent"
                     }`}
                   >
                     <div className={`p-2 rounded-[14px] ${activeConversation?.id === c.id ? "bg-indigo-500/20 text-indigo-400" : "bg-white/5 text-slate-500"}`}>
                       <FileText className="w-4 h-4" />
                     </div>
                     <div className="min-w-0 flex-1">
                        <p className={`font-bold truncate text-[13px] ${activeConversation?.id === c.id ? "text-white" : "text-slate-400"}`}>
                          {c.title || "Discussion"}
                        </p>
                        <p className="text-[9px] font-black tracking-widest text-slate-600 uppercase mt-1">
                          {c.message_count || 0} MESSAGES
                        </p>
                     </div>
                     <button onClick={(e) => deleteConversation(c.id, e)} className="opacity-0 group-hover:opacity-50 hover:!opacity-100 hover:text-red-400 transition-all">
                       <Trash2 className="w-4 h-4" />
                     </button>
                   </div>
                 ))}
              </div>
           </div>
        </aside>

        {/* ── Main Chat Area (Fluid) ───────────────────── */}
        <main className="flex-1 flex flex-col relative bg-white/[0.01] border border-white/5 backdrop-blur-3xl rounded-[40px] overflow-hidden">
           {/* Sidebar Toggle */}
           <button 
             onClick={() => setSidebarOpen(!sidebarOpen)}
             className="absolute top-6 left-6 z-20 p-3 rounded-full bg-white/5 border border-white/5 text-slate-400 hover:text-white transition-all shadow-xl"
           >
              <ChevronLeft className={`w-4 h-4 transition-transform duration-500 ${sidebarOpen ? "" : "rotate-180"}`} />
           </button>

           <div className="flex-1 overflow-y-auto px-10 py-20 space-y-12 scrollbar-hidden">
              {!activeConversation && (
                <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-10 animate-fluid-in">
                   <div className="w-24 h-24 rounded-[36px] bg-gradient-brand flex items-center justify-center shadow-2xl shadow-indigo-500/20">
                      <Bot className="w-12 h-12 text-white" />
                   </div>
                   <div className="space-y-4">
                      <h2 className="text-4xl font-black tracking-tighter text-white">Interface Cognitive</h2>
                      <p className="text-slate-500 text-lg font-medium leading-relaxed">
                        Exploration documentaire assistée par RAG. <br /> Posez votre question pour commencer l'analyse.
                      </p>
                   </div>
                </div>
              )}

              {(activeConversation?.messages || []).map((msg) => (
                <div key={msg.id} className={`flex gap-6 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"} animate-fluid-in`}>
                   <div className={`w-12 h-12 rounded-[18px] flex items-center justify-center shrink-0 border shadow-2xl ${
                     msg.role === "user" ? "bg-white/5 border-white/10 text-indigo-400" : "bg-gradient-brand text-white border-transparent"
                   }`}>
                      {msg.role === "user" ? <User className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
                   </div>

                   <div className={`flex flex-col gap-6 max-w-[75%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                      <div className={`p-8 rounded-[36px] text-base leading-relaxed font-medium shadow-2xl ${
                        msg.role === "user" 
                        ? "bg-white/5 text-white border border-white/10 rounded-tr-lg" 
                        : "bg-indigo-500/10 border border-indigo-500/10 text-slate-200 rounded-tl-lg"
                      }`}>
                         {msg.content}
                      </div>

                      {msg.citations && msg.citations.length > 0 && (
                        <div className="w-full bg-white/[0.02] border border-white/5 rounded-[28px] p-6 space-y-4">
                           <div className="flex items-center gap-2 text-[9px] font-black tracking-widest text-indigo-400 uppercase">
                              <Paperclip className="w-4 h-4" />
                              <span>Sources vérifiées</span>
                           </div>
                           <div className="grid grid-cols-1 gap-2">
                             {msg.citations.map((cit, i) => (
                               <div key={cit.id || i} className="flex items-center gap-4 p-4 rounded-[18px] bg-white/[0.01] border border-white/5 text-xs">
                                  <span className="font-black text-indigo-500/50">0{i + 1}</span>
                                  <span className="flex-1 font-bold text-slate-300 truncate">{cit.document_title}</span>
                                  <span className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-500/5 px-2 py-1 rounded-lg">
                                    {(cit.similarity * 100).toFixed(0)}% Precise
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
                <div className="flex gap-6 animate-pulse">
                   <div className="w-12 h-12 rounded-[18px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                      <Bot className="w-6 h-6" />
                   </div>
                   <div className="p-8 rounded-[36px] rounded-tl-lg bg-indigo-500/5 border border-white/5 space-x-2 flex items-center">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                   </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-4" />
           </div>

           {/* Input Pill */}
           <div className="p-10 bg-gradient-to-t from-[#131722]/80 to-transparent">
              <div className="max-w-4xl mx-auto relative group">
                 <div className="absolute -inset-1 bg-gradient-brand opacity-0 group-focus-within:opacity-20 blur-2xl transition-all duration-700 pointer-events-none rounded-[36px]" />
                 <div className="relative flex items-center">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Analyse documentaire..."
                      rows={1}
                      className="w-full bg-[#1e2330]/60 border border-white/5 rounded-[36px] py-6 pl-10 pr-24 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/30 shadow-2xl transition-all resize-none min-h-[84px] max-h-64 font-medium"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || sending}
                      className="absolute right-4 p-5 rounded-[28px] text-white bg-gradient-brand shadow-2xl disabled:opacity-30 hover:shadow-indigo-500/40 active:scale-90 transition-all"
                    >
                       <Send className="w-5 h-5" />
                    </button>
                 </div>
              </div>
           </div>
        </main>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
