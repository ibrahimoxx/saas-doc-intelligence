"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { tenantService } from "@/services/tenant.service";
import {
  conversationService,
  type Conversation,
  type Message,
} from "@/services/conversation.service";
import type { TenantMembership } from "@/types/tenant.types";

import { Suspense } from "react";

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [tenants, setTenants] = useState<TenantMembership[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);

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

  const [error, setError] = useState("");

  const handleSend = async () => {
    if (!input.trim() || sending || !selectedTenant) return;
    const question = input;
    setInput("");
    setSending(true);
    setError("");

    if (activeConversation) {
      // Optimistic: show user message immediately
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
      setActiveConversation((prev) => {
        if (!prev) return prev;
        return { ...prev, messages: [...(prev.messages || []), tempUserMsg] };
      });

      // Send follow-up message
      const res = await conversationService.sendMessage(
        selectedTenant,
        activeConversation.id,
        question
      );
      if (res.data) {
        setActiveConversation((prev) => {
          if (!prev) return prev;
          // Replace temp message with real ones
          const msgs = (prev.messages || []).filter((m) => m.id !== tempUserMsg.id);
          return {
            ...prev,
            messages: [...msgs, res.data!.user_message, res.data!.assistant_message],
          };
        });
      } else {
        console.error("Chat error:", res.error);
        setError(res.error?.message || "Erreur lors de l'envoi du message.");
      }
    } else {
      // Create new conversation
      const res = await conversationService.create(selectedTenant, {
        first_message: question,
      });
      if (res.data) {
        setActiveConversation(res.data);
        setConversations((prev) => [res.data!, ...prev]);
      } else {
        console.error("Chat create error:", res.error);
        setError(res.error?.message || "Erreur lors de la création de la conversation.");
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

  const startNewChat = () => {
    setActiveConversation(null);
    setInput("");
    setError("");
  };

  if (isLoading) {
    return (
      <div className="chat-loading">
        <div className="loader" />
        <style jsx>{`
          .chat-loading {
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
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  const deleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedTenant) return;
    if (!confirm("Supprimer cette conversation ?")) return;

    await conversationService.archive(selectedTenant, convId);
    setConversations((prev) => prev.filter((c) => c.id !== convId));
    if (activeConversation?.id === convId) {
      setActiveConversation(null);
    }
  };

  if (!isAuthenticated) return null;

  const messages = activeConversation?.messages || [];

  return (
    <div className="chat-page">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <button onClick={() => router.push("/dashboard")} className="back-btn">
            ← Dashboard
          </button>
          <h2>💬 Conversations</h2>
          <button onClick={startNewChat} className="new-chat-btn">
            + Nouveau
          </button>
        </div>

        <div className="conv-list">
          {conversations.map((c) => (
            <div
              key={c.id}
              className={`conv-item ${activeConversation?.id === c.id ? "active" : ""}`}
              onClick={() => openConversation(c.id)}
            >
              <div className="conv-row">
                <div className="conv-info">
                  <div className="conv-title">{c.title || "Sans titre"}</div>
                  <div className="conv-meta">
                    {c.message_count || 0} msg · {new Date(c.updated_at).toLocaleDateString("fr-FR")}
                  </div>
                </div>
                <button
                  className="delete-conv-btn"
                  onClick={(e) => deleteConversation(c.id, e)}
                  title="Supprimer"
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
          {conversations.length === 0 && !loadingConversations && (
            <div className="no-conv">Aucune conversation. Posez une question !</div>
          )}
        </div>
      </aside>

      {/* Chat area */}
      <main className="chat-main">
        {/* Messages */}
        <div className="messages-area">
          {messages.length === 0 && !activeConversation && (
            <div className="welcome-chat">
              <div className="welcome-icon">🤖</div>
              <h2>DocPilot AI</h2>
              <p>Posez une question sur vos documents. L&apos;IA répondra avec des citations sourcées.</p>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`message ${msg.role}`}>
              <div className="msg-avatar">{msg.role === "user" ? "👤" : "🤖"}</div>
              <div className="msg-body">
                <div className="msg-content">{msg.content}</div>
                {msg.citations && msg.citations.length > 0 && (
                  <div className="citations">
                    <div className="citations-title">📎 Sources :</div>
                    {msg.citations.map((cit, i) => (
                      <div key={cit.id || i} className="citation-item">
                        <span className="cit-doc">{cit.document_title}</span>
                        {cit.page_number && (
                          <span className="cit-page">p.{cit.page_number}</span>
                        )}
                        <span className="cit-score">
                          {Math.round(cit.similarity * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {msg.latency_ms > 0 && (
                  <div className="msg-meta">
                    {msg.model_name} · {msg.total_tokens} tokens · {msg.latency_ms}ms
                  </div>
                )}
              </div>
            </div>
          ))}
          {sending && (
            <div className="message assistant">
              <div className="msg-avatar">🤖</div>
              <div className="msg-body">
                <div className="msg-content typing">
                  <span className="dot" /><span className="dot" /><span className="dot" />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="error-banner">⚠️ {error}</div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="input-area">
          <textarea
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Posez votre question..."
            rows={1}
            disabled={sending}
          />
          <button
            onClick={handleSend}
            className="send-btn"
            disabled={!input.trim() || sending}
          >
            {sending ? "⏳" : "➤"}
          </button>
        </div>
      </main>

      <style jsx>{`
        .chat-page {
          display: flex;
          height: 100vh;
          background: #0f172a;
          color: #e2e8f0;
        }

        /* Sidebar */
        .sidebar {
          width: 300px;
          border-right: 1px solid rgba(99, 102, 241, 0.15);
          display: flex;
          flex-direction: column;
          background: rgba(15, 23, 42, 0.95);
        }

        .sidebar-header {
          padding: 1rem;
          border-bottom: 1px solid rgba(99, 102, 241, 0.1);
        }

        .sidebar-header h2 {
          font-size: 1rem;
          margin: 0.5rem 0;
        }

        .back-btn {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          font-size: 0.8rem;
          padding: 0;
          margin-bottom: 0.5rem;
          display: block;
        }

        .back-btn:hover {
          color: #a5b4fc;
        }

        .new-chat-btn {
          width: 100%;
          padding: 0.6rem;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border: none;
          border-radius: 8px;
          color: white;
          font-size: 0.85rem;
          cursor: pointer;
          margin-top: 0.5rem;
          transition: opacity 0.2s;
        }

        .new-chat-btn:hover {
          opacity: 0.9;
        }

        .conv-list {
          flex: 1;
          overflow-y: auto;
          padding: 0.5rem;
        }

        .conv-item {
          padding: 0.8rem;
          border-radius: 8px;
          cursor: pointer;
          margin-bottom: 0.25rem;
          transition: background 0.15s;
        }

        .conv-item:hover {
          background: rgba(99, 102, 241, 0.08);
        }

        .conv-item.active {
          background: rgba(99, 102, 241, 0.15);
          border-left: 3px solid #6366f1;
        }

        .conv-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .conv-info {
          flex: 1;
          min-width: 0;
        }

        .delete-conv-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 0.8rem;
          opacity: 0;
          transition: opacity 0.2s;
          padding: 0.25rem;
          border-radius: 4px;
        }

        .delete-conv-btn:hover {
          background: rgba(239, 68, 68, 0.2);
        }

        .conv-item:hover .delete-conv-btn {
          opacity: 0.7;
        }

        .delete-conv-btn:hover {
          opacity: 1 !important;
        }

        .conv-title {
          font-size: 0.85rem;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .conv-meta {
          font-size: 0.7rem;
          color: #64748b;
          margin-top: 0.2rem;
        }

        .no-conv {
          text-align: center;
          color: #64748b;
          font-size: 0.8rem;
          padding: 2rem 1rem;
        }

        /* Chat main */
        .chat-main {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .messages-area {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
        }

        .welcome-chat {
          text-align: center;
          padding: 4rem 2rem;
        }

        .welcome-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .welcome-chat h2 {
          font-size: 1.5rem;
          background: linear-gradient(135deg, #6366f1, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 0.5rem;
        }

        .welcome-chat p {
          color: #94a3b8;
          font-size: 0.95rem;
        }

        /* Messages */
        .message {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
          max-width: 800px;
        }

        .message.user {
          margin-left: auto;
          flex-direction: row-reverse;
        }

        .msg-avatar {
          font-size: 1.3rem;
          flex-shrink: 0;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: rgba(99, 102, 241, 0.1);
        }

        .msg-body {
          flex: 1;
        }

        .msg-content {
          padding: 1rem 1.2rem;
          border-radius: 16px;
          font-size: 0.9rem;
          line-height: 1.6;
          white-space: pre-wrap;
        }

        .message.user .msg-content {
          background: linear-gradient(135deg, #6366f1, #7c3aed);
          border-radius: 16px 16px 4px 16px;
        }

        .message.assistant .msg-content {
          background: rgba(30, 27, 75, 0.4);
          border: 1px solid rgba(99, 102, 241, 0.15);
          border-radius: 16px 16px 16px 4px;
        }

        /* Citations */
        .citations {
          margin-top: 0.5rem;
          padding: 0.75rem 1rem;
          background: rgba(99, 102, 241, 0.05);
          border: 1px solid rgba(99, 102, 241, 0.1);
          border-radius: 10px;
        }

        .citations-title {
          font-size: 0.75rem;
          color: #a5b4fc;
          margin-bottom: 0.4rem;
          font-weight: 600;
        }

        .citation-item {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          font-size: 0.75rem;
          padding: 0.2rem 0;
          color: #94a3b8;
        }

        .cit-doc {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .cit-page {
          color: #64748b;
        }

        .cit-score {
          color: #22c55e;
          font-weight: 600;
        }

        .msg-meta {
          font-size: 0.7rem;
          color: #475569;
          margin-top: 0.3rem;
          padding-left: 1.2rem;
        }

        /* Input */
        .input-area {
          padding: 1rem 1.5rem;
          border-top: 1px solid rgba(99, 102, 241, 0.1);
          display: flex;
          gap: 0.75rem;
          align-items: flex-end;
          background: rgba(15, 23, 42, 0.8);
        }

        .chat-input {
          flex: 1;
          padding: 0.8rem 1rem;
          background: rgba(30, 27, 75, 0.4);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 12px;
          color: #e2e8f0;
          font-size: 0.9rem;
          resize: none;
          outline: none;
          font-family: inherit;
          min-height: 44px;
          max-height: 120px;
        }

        .chat-input:focus {
          border-color: #6366f1;
        }

        .chat-input::placeholder {
          color: #475569;
        }

        .send-btn {
          padding: 0.8rem 1.2rem;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border: none;
          border-radius: 12px;
          color: white;
          font-size: 1.1rem;
          cursor: pointer;
          transition: opacity 0.2s;
          min-width: 48px;
        }

        .send-btn:hover:not(:disabled) {
          opacity: 0.9;
        }

        .send-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .typing {
          display: flex;
          gap: 6px;
          padding: 1rem 1.5rem !important;
        }

        .dot {
          width: 8px;
          height: 8px;
          background: #6366f1;
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out;
        }

        .dot:nth-child(2) { animation-delay: 0.2s; }
        .dot:nth-child(3) { animation-delay: 0.4s; }

        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }

        .error-banner {
          padding: 0.75rem 1rem;
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 10px;
          color: #fca5a5;
          font-size: 0.85rem;
          margin-bottom: 1rem;
        }
      `}</style>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
