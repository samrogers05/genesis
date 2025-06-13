'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { Home, User, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { Database } from '@/types/supabase';

type Message = Database['public']['Tables']['messages']['Row'] & {
  sender: Database['public']['Tables']['Profile']['Row'];
  receiver: Database['public']['Tables']['Profile']['Row'];
};

interface Conversation {
  id: string;
  other_user: Database['public']['Tables']['Profile']['Row'];
  last_message: {
    content: string;
    createdat: string;
  } | null;
}

export default function ChatListPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const { user } = useAuth();

  useEffect(() => {
    async function loadConversations() {
      if (!user) return;

      try {
        // Get all messages where the current user is either sender or receiver
        const { data: messages, error: messagesError } = await supabase
          .from('messages')
          .select(`
            id,
            sender_id,
            receiver_id,
            content,
            createdat,
            sender:Profile!messages_sender_id_fkey(id, fullName, avatarUrl, email),
            receiver:Profile!messages_receiver_id_fkey(id, fullName, avatarUrl, email)
          `)
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('createdat', { ascending: false });

        if (messagesError) throw messagesError;

        // Group messages by conversation
        const conversationMap = new Map<string, Conversation>();
        (messages as unknown as Message[]).forEach((message) => {
          const otherUserId = message.sender_id === user.id ? message.receiver_id : message.sender_id;
          const otherUser = message.sender_id === user.id ? message.receiver : message.sender;

          if (!conversationMap.has(otherUserId)) {
            conversationMap.set(otherUserId, {
              id: otherUserId,
              other_user: otherUser,
              last_message: {
                content: message.content,
                createdat: message.createdat,
              },
            });
          }
        });

        setConversations(Array.from(conversationMap.values()));
        setError(null);
      } catch (err) {
        console.error('Error loading conversations:', err);
        setError('Failed to load conversations');
      } finally {
        setLoading(false);
      }
    }

    loadConversations();
  }, [user, supabase]);

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">Please sign in</h1>
          <p className="text-slate-600">You need to be signed in to use the chat.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading conversations...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">Error</h1>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-slate-900">Messages</h1>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm divide-y divide-slate-200">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-slate-600">
              No conversations yet. Start a chat by clicking the "Collaborate" button on a project.
            </div>
          ) : (
            conversations.map((conversation) => (
              <Link
                key={conversation.id}
                href={`/chat/${conversation.id}`}
                className="block hover:bg-slate-50 transition-colors duration-200"
              >
                <div className="flex items-center gap-4 p-4">
                  <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                    {conversation.other_user.avatarUrl ? (
                      <img
                        src={conversation.other_user.avatarUrl}
                        alt={conversation.other_user.fullName || 'User'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-slate-600 text-sm font-semibold">
                        {(conversation.other_user.fullName || 'User')
                          .split(' ')
                          .map((n: string) => n[0])
                          .join('')}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h2 className="text-sm font-medium text-slate-900 truncate">
                        {conversation.other_user.fullName || 'User'}
                      </h2>
                      {conversation.last_message && (
                        <span className="text-xs text-slate-500">
                          {format(new Date(conversation.last_message.createdat), 'h:mm a')}
                        </span>
                      )}
                    </div>
                    {conversation.last_message && (
                      <p className="text-sm text-slate-500 truncate">
                        {conversation.last_message.content}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </main>

      {/* Navigation */}
      <nav className="bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-around h-16">
            <Link
              href="/"
              className="flex flex-col items-center justify-center text-slate-600 hover:text-slate-900"
            >
              <Home className="w-6 h-6" />
              <span className="text-xs mt-1">Home</span>
            </Link>
            <Link
              href="/profile"
              className="flex flex-col items-center justify-center text-slate-600 hover:text-slate-900"
            >
              <User className="w-6 h-6" />
              <span className="text-xs mt-1">Profile</span>
            </Link>
            <Link
              href="/chat"
              className="flex flex-col items-center justify-center text-emerald-600"
            >
              <MessageSquare className="w-6 h-6" />
              <span className="text-xs mt-1">Chat</span>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
} 