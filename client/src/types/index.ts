export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface ChatResponsePayload {
  conversationId: string;
  userMessage: Message;
  assistantMessage: Message;
}
