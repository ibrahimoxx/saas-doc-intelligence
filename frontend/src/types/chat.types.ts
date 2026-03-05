/**
 * DocPilot AI — Chat Types
 */

export interface Conversation {
  id: string;
  tenant_id: string;
  title: string;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  response_status?: "ok" | "no_answer" | "error";
  citations?: Citation[];
  created_at: string;
}

export interface Citation {
  id: string;
  document_id: string;
  document_title: string;
  quote_text: string;
  page_number: number | null;
  citation_order: number;
  score: number | null;
}

export interface AskRequest {
  question: string;
  conversation_id?: string;
  knowledge_space_id?: string;
}

export interface AskResponse {
  conversation_id: string;
  message: Message;
}
