import React, { useEffect, useState, useRef } from 'react';
import { AppLayout } from '../components/AppLayout';
import { api } from '../lib/api';
import { Conversation, Message } from '../types';
import {
  Send,
  Plus,
  Trash2,
  Sparkles,
  Bot,
  User,
  AlertCircle,
  MessageSquare,
  RefreshCw,
  Zap,
  Code,
  Lightbulb,
  Compass
} from 'lucide-react';

export const Chat: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  // Load all user conversations
  const loadConversations = async () => {
    try {
      setLoadingConversations(true);
      const data = await api.getConversations();
      setConversations(data);
      if (data.length > 0 && !activeConvId) {
        setActiveConvId(data[0].id);
      }
    } catch (err: any) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // Fetch messages when active conversation changes
  useEffect(() => {
    if (!activeConvId) {
      setMessages([]);
      return;
    }

    async function loadDetail() {
      try {
        setLoadingMessages(true);
        setError(null);
        const detail = await api.getConversationDetail(activeConvId!);
        setMessages(detail.messages || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load conversation history');
      } finally {
        setLoadingMessages(false);
      }
    }

    loadDetail();
  }, [activeConvId]);

  // Create a new conversation session
  const handleNewChat = () => {
    setActiveConvId(null);
    setMessages([]);
    setError(null);
    inputRef.current?.focus();
  };

  // Delete a conversation session
  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await api.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConvId === id) {
        setActiveConvId(null);
        setMessages([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete conversation');
    }
  };

  // Send message submit handler
  const handleSendMessage = async (e?: React.FormEvent, promptOverride?: string) => {
    if (e) e.preventDefault();
    const textToSend = promptOverride || inputMessage;

    if (!textToSend.trim() || sending) return;

    const tempUserMsgId = `temp-user-${Date.now()}`;
    const optimisticUserMsg: Message = {
      id: tempUserMsgId,
      conversation_id: activeConvId || '',
      sender: 'user',
      content: textToSend,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticUserMsg]);
    if (!promptOverride) setInputMessage('');
    setSending(true);
    setError(null);

    try {
      const res = await api.sendMessage(textToSend, activeConvId || undefined);
      
      // Update active conversation ID if created newly
      if (!activeConvId) {
        setActiveConvId(res.conversationId);
      }

      // Replace messages with updated from backend
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMsgId),
        res.userMessage,
        res.assistantMessage,
      ]);

      // Refresh list of conversations
      loadConversations();
    } catch (err: any) {
      setError(err.message || 'Failed to get AI response. Please try again.');
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsgId));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const starterPrompts = [
    {
      icon: Code,
      title: 'Explain standard RLS in Supabase',
      desc: 'Learn how Row Level Security policies isolate multi-tenant user data in PostgreSQL.',
    },
    {
      icon: Lightbulb,
      title: 'Generate TypeScript React hook',
      desc: 'Build a reusable custom React hook with clean generics and error handling.',
    },
    {
      icon: Compass,
      title: 'Compare REST vs GraphQL APIs',
      desc: 'Deep dive into performance, over-fetching, and cache management strategies.',
    },
  ];

  return (
    <AppLayout>
      <div className="flex flex-1 h-[calc(100vh-4rem)] md:h-screen overflow-hidden bg-[#0b0f19]">
        {/* Sub-Sidebar / History Pane */}
        <div className="w-80 bg-slate-900/60 border-r border-slate-800/80 hidden lg:flex flex-col">
          <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>Chat History</span>
            </h2>
            <button
              onClick={handleNewChat}
              className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-lg border border-emerald-500/30 flex items-center space-x-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Chat</span>
            </button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {loadingConversations ? (
              <div className="p-4 text-center text-slate-500 text-xs space-y-2">
                <RefreshCw className="w-4 h-4 animate-spin mx-auto text-emerald-500" />
                <p>Loading history...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                No past conversations yet. Start a new chat!
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer text-sm transition-all duration-150 ${
                    activeConvId === conv.id
                      ? 'bg-slate-800/90 text-white font-medium border border-slate-700/80 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                    <MessageSquare className={`w-4 h-4 flex-shrink-0 ${activeConvId === conv.id ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <span className="truncate">{conv.title}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteConversation(e, conv.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 transition-opacity text-slate-500"
                    title="Delete chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Chat Interface */}
        <div className="flex-1 flex flex-col min-w-0 h-full">
          {/* Top Bar for Chat Mobile Toggle & Status */}
          <div className="h-16 px-6 border-b border-slate-800/80 bg-slate-900/40 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                  <span>Gemini 2.5 Assistant</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    Online
                  </span>
                </h2>
                <p className="text-[11px] text-slate-400">Secure backend API proxy with `@google/genai`</p>
              </div>
            </div>

            <button
              onClick={handleNewChat}
              className="lg:hidden px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold rounded-lg flex items-center space-x-1 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New</span>
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between text-rose-400 text-xs">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
              <button onClick={() => setError(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
          )}

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            {loadingMessages ? (
              <div className="h-full flex items-center justify-center space-x-2 text-slate-400 text-sm">
                <RefreshCw className="w-5 h-5 animate-spin text-emerald-500" />
                <span>Fetching message history...</span>
              </div>
            ) : messages.length === 0 ? (
              /* Starter Empty State */
              <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center p-6 space-y-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-xl shadow-emerald-500/20">
                  <Sparkles className="w-9 h-9 text-white" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-extrabold text-white tracking-tight">
                    How can AskFlow AI help you today?
                  </h3>
                  <p className="text-slate-400 text-sm">
                    Select a starter prompt below or enter any request to query Google Gemini.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full text-left">
                  {starterPrompts.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(undefined, item.title)}
                      className="glass-card p-4 rounded-xl flex flex-col justify-between hover:border-emerald-500/40 group transition-all"
                    >
                      <item.icon className="w-5 h-5 text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
                      <div>
                        <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                          {item.desc}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Render Messages */
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start space-x-3.5 max-w-4xl ${
                    msg.sender === 'user' ? 'ml-auto flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      msg.sender === 'user'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                    }`}
                  >
                    {msg.sender === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                  </div>

                  {/* Bubble */}
                  <div
                    className={`p-4 rounded-2xl text-sm leading-relaxed max-w-[85%] ${
                      msg.sender === 'user'
                        ? 'bg-emerald-600 text-white rounded-tr-none shadow-lg shadow-emerald-600/10'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                    }`}
                  >
                    <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                    <span className="block text-[10px] opacity-50 mt-2 text-right">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}

            {/* AI Generation Loading Indicator */}
            {sending && (
              <div className="flex items-start space-x-3.5 max-w-4xl">
                <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 rounded-tl-none flex items-center space-x-2 text-xs">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                  <span>Gemini is thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Chat Input Form */}
          <div className="p-4 md:p-6 bg-slate-900/60 border-t border-slate-800/80">
            <form onSubmit={(e) => handleSendMessage(e)} className="max-w-4xl mx-auto relative">
              <textarea
                ref={inputRef}
                rows={1}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Gemini AI anything..."
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-2xl pl-4 pr-14 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm resize-none"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || sending}
                className="absolute right-2.5 top-2.5 p-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-white rounded-xl transition-all flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <p className="text-[11px] text-center text-slate-500 mt-2">
              Conversations are stored with Row Level Security in Supabase PostgreSQL.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
