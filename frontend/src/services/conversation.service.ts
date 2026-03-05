/**
 * DocPilot AI — Conversations Service
 */

import { apiClient, type ApiResponse } from "@/lib/api-client";

export interface Citation {
  id: string;
  document_title: string;
  file_name: string;
  page_number: number | null;
  similarity: number;
  excerpt: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  model_name: string;
  total_tokens: number;
  latency_ms: number;
  citations: Citation[];
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  status: string;
  knowledge_space_id: string | null;
  messages?: Message[];
  message_count?: number;
  last_message?: { role: string; content: string; created_at: string } | null;
  created_at: string;
  updated_at: string;
}

export const conversationService = {
  list: (tenantId: string) =>
    apiClient.get<Conversation[]>(`/tenants/${tenantId}/conversations/`),

  create: (tenantId: string, data: { first_message: string; knowledge_space_id?: string; title?: string }) =>
    apiClient.post<Conversation>(`/tenants/${tenantId}/conversations/`, data),

  detail: (tenantId: string, conversationId: string) =>
    apiClient.get<Conversation>(`/tenants/${tenantId}/conversations/${conversationId}/`),

  sendMessage: (tenantId: string, conversationId: string, content: string) =>
    apiClient.post<{ user_message: Message; assistant_message: Message }>(
      `/tenants/${tenantId}/conversations/${conversationId}/messages/`,
      { content }
    ),

  archive: (tenantId: string, conversationId: string) =>
    apiClient.delete(`/tenants/${tenantId}/conversations/${conversationId}/`),
};
