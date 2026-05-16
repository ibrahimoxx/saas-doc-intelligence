"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useTenants } from "@/hooks/useTenants";
import {
  conversationService,
  type Conversation,
  type Message,
} from "@/services/conversation.service";
import { TopBar } from "@/components/layout/TopBar";
import { PageLoader } from "@/components/ui/LoadingSpinner";
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

const suggestedPrompts = [
  "Résume les points clés de ce document.",
  "Quelles sont les obligations contractuelles mentionnées ?",
  "Y a-t-il des dates ou délais importants ?",
  "Identifie les risques ou points d'attention.",
];

function ChatContent() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const shouldReduceMotion = useReducedMotion();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { tenants, selectedTenantId: selectedTenant, setSelectedTenantId: setSelectedTenant, loading: loadingTenants } = useTenants();
  const currentRole = tenants.find((t) => t.tenant.id === selectedTenant)?.role ?? "member";
  const isAdminOrOwner = currentRole === "admin" || currentRole === "owner";

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
    if (!loadingTenants && tenants.length === 0) setLoadingConversations(false);
  }, [loadingTenants, tenants.length]);

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
      // Show user message immediately — don't wait for Ollama
      const tempId = "temp-conv-" + Date.now();
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
      setActiveConversation({
        id: tempId,
        title: question.slice(0, 80),
        status: "active",
        knowledge_space_id: null,
        messages: [tempUserMsg],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      try {
        const res = await conversationService.create(selectedTenant, { first_message: question });
        if (res.data) {
          setActiveConversation(res.data);
          setConversations((prev) => [res.data!, ...prev]);
        } else {
          setError(res.error?.message || "Erreur fatale.");
          setActiveConversation(null);
        }
      } catch {
        setError("Erreur réseau. Réessayez.");
        setActiveConversation(null);
      }
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canDeleteConversation = (conv: Conversation): boolean => {
    if (currentRole === "owner") return true;
    return !conv.user_id || conv.user_id === user?.id;
  };

  const deleteConversation = async (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedTenant || !canDeleteConversation(conv)) return;
    if (!confirm("Supprimer l'historique ?")) return;
    await conversationService.archive(selectedTenant, conv.id);
    setConversations((prev) => prev.filter((c) => c.id !== conv.id));
    if (activeConversation?.id === conv.id) setActiveConversation(null);
  };

  if (isLoading || (!isAuthenticated && !isLoading)) return <PageLoader />;

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

      <div className="flex flex-1 overflow-hidden pt-14 gap-0">
        {/* Sidebar */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.aside
              key="sidebar"
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -16 }}
              transition={{ duration: 0.25 }}
              className="flex w-72 shrink-0 flex-col border-r border-border-subtle bg-bg-elevated-1/60 backdrop-blur-sm"
            >
              <div className="flex flex-col gap-4 p-4 h-full">
                <button
                  onClick={() => {
                    setActiveConversation(null);
                    setInput("");
                  }}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-brand-primary/20 bg-brand-primary/10 py-2.5 text-sm font-semibold text-brand-primary transition-colors hover:bg-brand-primary/20"
                >
                  <Plus className="h-4 w-4" />
                  Nouveau chat
                </button>

                <div className="flex-1 overflow-y-auto space-y-1 scrollbar-hidden pr-1">
                  {loadingConversations ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="h-5 w-5 rounded-full border-2 border-bg-elevated-3 border-t-brand-primary animate-spin" />
                    </div>
                  ) : conversations.length === 0 ? (
                    <p className="px-3 py-4 text-center text-xs text-fg-tertiary">
                      Aucune conversation
                    </p>
                  ) : (
                    <>
                      {isAdminOrOwner && conversations.some((c) => !c.user_id || c.user_id === user?.id) && (
                        <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-fg-tertiary">
                          Mes conversations
                        </p>
                      )}
                      {conversations
                        .filter((c) => !isAdminOrOwner || !c.user_id || c.user_id === user?.id)
                        .map((c) => (
                          <ConversationRow
                            key={c.id}
                            conv={c}
                            active={activeConversation?.id === c.id}
                            canDelete={canDeleteConversation(c)}
                            onOpen={() => openConversation(c.id)}
                            onDelete={(e) => deleteConversation(c, e)}
                          />
                        ))}

                      {isAdminOrOwner && conversations.some((c) => c.user_id && c.user_id !== user?.id) && (
                        <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-fg-tertiary">
                          Conversations membres
                        </p>
                      )}
                      {isAdminOrOwner &&
                        conversations
                          .filter((c) => c.user_id && c.user_id !== user?.id)
                          .map((c) => (
                            <ConversationRow
                              key={c.id}
                              conv={c}
                              active={activeConversation?.id === c.id}
                              canDelete={canDeleteConversation(c)}
                              onOpen={() => openConversation(c.id)}
                              onDelete={(e) => deleteConversation(c, e)}
                            />
                          ))}
                    </>
                  )}
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main chat */}
        <main className="relative flex flex-1 flex-col overflow-hidden" id="main">
          {/* Sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="absolute left-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-xl border border-border-subtle bg-bg-elevated-1 text-fg-tertiary transition-colors hover:text-fg-primary"
            aria-label={sidebarOpen ? "Masquer le panneau" : "Afficher le panneau"}
          >
            <ChevronLeft
              className={`h-4 w-4 transition-transform duration-300 ${sidebarOpen ? "" : "rotate-180"}`}
            />
          </button>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-hidden">
            {!activeConversation ? (
              <div className="flex h-full flex-col items-center justify-center text-center max-w-lg mx-auto space-y-8 pt-8">
                <div className="flex h-20 w-20 items-center justify-center rounded-[28px] aurora-bg shadow-[0_24px_64px_-16px_rgba(99,102,241,0.5)]">
                  <Bot className="h-10 w-10 text-white" />
                </div>
                <div className="space-y-3">
                  <h2 className="font-serif text-3xl tracking-tight text-fg-primary">
                    Interface Cognitive
                  </h2>
                  <p className="text-sm leading-7 text-fg-secondary">
                    Exploration documentaire assistée par RAG.<br />
                    Posez votre question pour commencer l'analyse.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2 w-full sm:grid-cols-2">
                  {suggestedPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => setInput(prompt)}
                      className="rounded-2xl border border-border-subtle bg-bg-elevated-1 px-4 py-3 text-left text-xs font-medium text-fg-secondary transition-colors hover:border-brand-primary/30 hover:bg-brand-primary/5 hover:text-fg-primary"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {(activeConversation?.messages || []).map((msg) => (
                  <MessageBubble key={msg.id} msg={msg} shouldReduceMotion={!!shouldReduceMotion} />
                ))}

                {sending && (
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl aurora-bg">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-border-subtle bg-bg-elevated-1 px-4 py-3">
                      {[0, 0.15, 0.3].map((delay, i) => (
                        <span
                          key={i}
                          className="h-1.5 w-1.5 rounded-full bg-brand-primary animate-bounce"
                          style={{ animationDelay: `${delay}s` }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {error && (
                  <p className="text-center text-xs text-error">{error}</p>
                )}

                <div ref={messagesEndRef} className="h-2" />
              </>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-border-subtle bg-bg-base/80 p-4 backdrop-blur-sm">
            <div className="relative mx-auto max-w-3xl">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Analyse documentaire…"
                rows={1}
                className="w-full resize-none rounded-2xl border border-border-subtle bg-bg-elevated-1 py-3.5 pl-4 pr-14 text-sm text-fg-primary placeholder:text-fg-tertiary focus:border-brand-primary/50 focus:outline-none transition-colors min-h-13 max-h-48"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="absolute bottom-2.5 right-2.5 flex h-9 w-9 items-center justify-center rounded-xl aurora-bg text-white shadow-[0_4px_16px_-4px_rgba(99,102,241,0.5)] transition-opacity disabled:opacity-30"
                aria-label="Envoyer"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function ConversationRow({
  conv,
  active,
  canDelete,
  onOpen,
  onDelete,
}: {
  conv: Conversation;
  active: boolean;
  canDelete: boolean;
  onOpen: () => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      onClick={onOpen}
      className={`group flex cursor-pointer items-start gap-3 rounded-xl p-3 transition-colors ${
        active
          ? "bg-brand-primary/10 border border-brand-primary/20"
          : "border border-transparent hover:bg-bg-elevated-2"
      }`}
    >
      <FileText
        className={`mt-0.5 h-4 w-4 shrink-0 ${active ? "text-brand-primary" : "text-fg-tertiary"}`}
      />
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-xs font-semibold ${
            active ? "text-fg-primary" : "text-fg-secondary"
          }`}
        >
          {conv.title || "Discussion"}
        </p>
        {conv.user_name && (
          <p className="truncate text-[10px] text-brand-primary/60 font-medium">
            {conv.user_name}
          </p>
        )}
        <p className="text-[10px] text-fg-tertiary">{conv.message_count || 0} messages</p>
      </div>
      {canDelete && (
        <button
          onClick={onDelete}
          className="shrink-0 opacity-0 group-hover:opacity-100 text-fg-tertiary hover:text-error transition-all"
          aria-label="Supprimer"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

function MessageBubble({
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

      <div className={`flex max-w-[75%] flex-col gap-3 ${isUser ? "items-end" : "items-start"}`}>
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
                  <span className="font-mono text-brand-primary/50">0{i + 1}</span>
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

export default function ChatPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ChatContent />
    </Suspense>
  );
}
