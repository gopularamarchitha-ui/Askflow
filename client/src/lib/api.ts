import { supabase } from './supabase';
import { Conversation, Message, ChatResponsePayload } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const getAuthHeaders = async (): Promise<HeadersInit> => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const api = {
  // Fetch all user conversations
  async getConversations(): Promise<Conversation[]> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/conversations`, { headers });
    
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch conversations');
    }
    
    const data = await response.json();
    return data.conversations || [];
  },

  // Create a new empty conversation
  async createConversation(title?: string): Promise<Conversation> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/conversations`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ title }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create conversation');
    }

    const data = await response.json();
    return data.conversation;
  },

  // Get a conversation detail with messages
  async getConversationDetail(id: string): Promise<{ conversation: Conversation; messages: Message[] }> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/conversations/${id}`, { headers });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch conversation detail');
    }

    return await response.json();
  },

  // Delete a conversation
  async deleteConversation(id: string): Promise<void> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/conversations/${id}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete conversation');
    }
  },

  // Send message to Gemini through backend API
  async sendMessage(message: string, conversationId?: string): Promise<ChatResponsePayload> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message, conversationId }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const msg = err.details ? `${err.error || 'Error'}: ${err.details}` : (err.error || 'Failed to send message to AI');
      throw new Error(msg);
    }

    return await response.json();
  },
};
