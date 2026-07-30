"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useTenants } from "@/hooks/useTenants";
import {
  conversationService,
  type Conversation,
  type Message,
} from "@/services/conversation.service";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { Modal } from "@/components/ui/Modal";
import {
  Plus,
  Trash2,
  FileText,
  Bot,
  User,
  Send,
  Paperclip,
  ChevronLeft,
  Loader2,
} from "lucide-react";

const suggestedPrompts = [
  "Résume les points clés de ce document.",
  "Quelles sont les obligations contractuelles mentionnées ?",
  "Y a-t-il des dates ou délais importants ?",
  "Identifie les risques ou points d'attention.",
];

function ChatContent() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { tenants, selectedTenantId: selectedTenant, loading: loadingTenants } = useTenants();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Conversation | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isLoading, isAuthenticated, router]);

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

  const deleteConversation = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTarget(conv);
  };

  const confirmDelete = async () => {
    if (!selectedTenant || !deleteTarget) return;
    await conversationService.archive(selectedTenant, deleteTarget.id);
    setConversations((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    if (activeConversation?.id === deleteTarget.id) setActiveConversation(null);
    setDeleteTarget(null);
  };

  if (isLoading || (!isAuthenticated && !isLoading)) return <PageLoader />;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Conversation panel */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            key="conversations"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex w-64 shrink-0 flex-col border-r border-border-subtle bg-bg-sidebar"
          >
            <div className="border-b border-border-subtle p-3">
              <button
                onClick={() => {
                  setActiveConversation(null);
                  setInput("");
                }}
                className="dc-btn w-full"
              >
                <Plus className="h-3.5 w-3.5" />
                Nouvelle conversation
              </button>
            </div>

            <div className="flex-1 space-y-0.5 overflow-y-auto p-2">
              {loadingConversations ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-4 w-4 animate-spin text-brand-primary" />
                </div>
              ) : conversations.length === 0 ? (
                <p className="px-3 py-4 text-center text-[12px] text-fg-tertiary">
                  Aucune conversation
                </p>
              ) : (
                conversations.map((c) => (
                  <ConversationRow
                    key={c.id}
                    conv={c}
                    active={activeConversation?.id === c.id}
                    onOpen={() => openConversation(c.id)}
                    onDelete={(e) => deleteConversation(c, e)}
                  />
                ))
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main chat column */}
      <div className="relative flex flex-1 flex-col overflow-hidden">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute left-3 top-3 z-20 flex h-7 w-7 items-center justify-center rounded-md border border-border-subtle bg-bg-elevated-1 text-fg-tertiary transition-colors hover:text-fg-primary"
          aria-label={sidebarOpen ? "Masquer le panneau" : "Afficher le panneau"}
        >
          <ChevronLeft
            className={`h-3.5 w-3.5 transition-transform duration-200 ${sidebarOpen ? "" : "rotate-180"}`}
          />
        </button>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {!activeConversation ? (
            <div className="mx-auto flex h-full max-w-[560px] flex-col items-center justify-center gap-6 text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-fg-primary">
                <Bot className="h-5 w-5 text-bg-base" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-fg-primary">
                  Interrogez vos documents
                </h2>
                <p className="text-[13px] leading-relaxed text-fg-secondary">
                  DocPilot IA répond uniquement à partir des documents indexés dans votre tenant.
                </p>
              </div>

              <div className="grid w-full grid-cols-1 gap-1.5 sm:grid-cols-2">
                {suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setInput(prompt)}
                    className="dc-card px-3 py-2.5 text-left text-[12px] font-medium text-fg-secondary transition-colors hover:border-border-strong hover:text-fg-primary"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto flex w-full max-w-[760px] flex-col gap-[18px]">
              {(activeConversation?.messages || []).map((msg) => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}

              {sending && (
                <div className="flex gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] bg-fg-primary">
                    <Bot className="h-3.5 w-3.5 text-bg-base" />
                  </div>
                  <div className="dc-card flex items-center gap-1.5 px-3.5 py-3">
                    {[0, 0.15, 0.3].map((delay, i) => (
                      <span
                        key={i}
                        className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-primary"
                        style={{ animationDelay: `${delay}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {error && <p className="text-center text-[12px] text-error">{error}</p>}

              <div ref={messagesEndRef} className="h-2" />
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="px-8 pb-5 pt-4">
          <div className="mx-auto max-w-[760px]">
            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Poser une question sur vos documents…"
                rows={1}
                className="max-h-48 min-h-[46px] w-full resize-none rounded-lg border border-border-strong bg-bg-elevated-2 py-3 pl-3.5 pr-12 text-[13px] text-fg-primary shadow-card transition-colors placeholder:text-fg-tertiary focus:border-brand-primary focus:outline-none"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="absolute bottom-2.5 right-2.5 flex h-[26px] w-[26px] items-center justify-center rounded-md bg-fg-primary text-bg-base transition-opacity disabled:opacity-30"
                aria-label="Envoyer"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] text-fg-tertiary">
              DocPilot IA répond uniquement à partir des documents indexés dans votre tenant — aucune
              donnée n'est partagée entre organisations.
            </p>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} width="max-w-sm">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-error-border bg-error-bg">
              <Trash2 className="h-4 w-4 text-error" />
            </div>
            <div className="min-w-0">
              <p className="text-[13.5px] font-semibold text-fg-primary">
                Supprimer la conversation
              </p>
              <p className="mt-0.5 line-clamp-2 text-[12px] text-fg-tertiary">
                {deleteTarget?.title || "Discussion"}
              </p>
            </div>
          </div>
          <p className="text-[13px] leading-relaxed text-fg-secondary">
            Cette conversation sera supprimée de votre historique. Cette action est irréversible.
          </p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setDeleteTarget(null)} className="dc-btn">
              Annuler
            </button>
            <button
              onClick={confirmDelete}
              className="rounded-md border border-error-border bg-error-bg px-3.5 py-2 text-[12.5px] font-semibold text-error transition-colors hover:brightness-95"
            >
              Supprimer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ConversationRow({
  conv,
  active,
  onOpen,
  onDelete,
}: {
  conv: Conversation;
  active: boolean;
  onOpen: () => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      onClick={onOpen}
      className={`group flex cursor-pointer items-start gap-2.5 rounded-[7px] px-2.5 py-2 transition-colors ${
        active ? "bg-brand-soft" : "hover:bg-bg-elevated-1"
      }`}
    >
      <FileText
        className={`mt-px h-3.5 w-3.5 shrink-0 ${active ? "text-brand-primary" : "text-fg-tertiary"}`}
      />
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-[12.5px] font-semibold ${
            active ? "text-brand-primary" : "text-fg-secondary"
          }`}
        >
          {conv.title || "Discussion"}
        </p>
        <p className="text-[11px] text-fg-tertiary">{conv.message_count || 0} messages</p>
      </div>
      <button
        onClick={onDelete}
        className="shrink-0 text-fg-tertiary opacity-0 transition-all hover:text-error group-hover:opacity-100"
        aria-label="Supprimer"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
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

export default function ChatPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ChatContent />
    </Suspense>
  );
}
