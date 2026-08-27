import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { MessageSquare, PlusCircle, Sparkles, TrendingUp, ArrowRight } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [totalConversations, setTotalConversations] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const userName =
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'User';

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      try {
        setLoading(true);
        const conversations = await api.getConversations();
        if (isMounted) {
          setTotalConversations(conversations.length);
        }
      } catch (error) {
        console.error('Failed to load dashboard metrics:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <AppLayout>
      <div className="p-6 md:p-10 max-w-6xl mx-auto w-full space-y-8">
        {/* Welcome Message Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/40 p-8 border border-slate-800 shadow-xl">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Workspace</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">{userName}</span> 👋
              </h1>
              <p className="text-slate-400 text-sm max-w-xl">
                AskFlow AI is ready to assist you with intelligent insights, coding context, and creative answers powered by Google Gemini.
              </p>
            </div>
          </div>
        </div>

        {/* Dashboard Grid - Two Simple Cards as Requested */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Total AI Conversations */}
          <div className="glass-card p-6 rounded-2xl flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <MessageSquare className="w-6 h-6" />
              </div>
              <span className="flex items-center space-x-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Active</span>
              </span>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total AI Conversations
              </p>
              <p className="text-4xl font-extrabold text-white mt-1">
                {loading ? (
                  <span className="inline-block w-16 h-8 bg-slate-800 animate-pulse rounded-md" />
                ) : (
                  totalConversations
                )}
              </p>
              <p className="text-xs text-slate-500 mt-1">Stored securely with Row Level Security in Supabase</p>
            </div>
          </div>

          {/* Card 2: Start New Chat Button */}
          <button
            onClick={() => navigate('/chat')}
            className="glass-card p-6 rounded-2xl flex flex-col justify-between text-left group hover:border-emerald-500/50 transition-all duration-300 cursor-pointer space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                <PlusCircle className="w-6 h-6" />
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-800 group-hover:bg-emerald-500 group-hover:text-white flex items-center justify-center text-slate-400 transition-colors">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Quick Action
              </p>
              <p className="text-2xl font-bold text-white mt-1 group-hover:text-emerald-300 transition-colors">
                Start New Chat
              </p>
              <p className="text-xs text-slate-400 mt-1">Launch a new session with Gemini 2.5 AI</p>
            </div>
          </button>
        </div>
      </div>
    </AppLayout>
  );
};
