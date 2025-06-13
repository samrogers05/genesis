'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { Home, User, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { Database } from '@/types/supabase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Search } from 'lucide-react';

type Message = Database['public']['Tables']['messages']['Row'] & {
  sender: Database['public']['Tables']['Profile']['Row'];
  receiver: Database['public']['Tables']['Profile']['Row'];
};

type Conversation = {
  id: string;
  other_user: {
    id: string;
    fullName: string | null;
    avatarUrl: string | null;
    email: string | null;
  };
  last_message: {
    id: string;
    content: string;
    createdat: string;
    sender_id: string;
    receiver_id: string;
  };
};

export default function ChatListPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingInvitations, setPendingInvitations] = useState(0);
  const supabase = createClient();
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      if (!user) return;

      try {
        // Load conversations
        const { data: conversationsData, error: conversationsError } = await supabase
          .from('messages')
          .select(`
            id,
            sender_id,
            receiver_id,
            content,
            createdat,
            sender:Profile!sender_id(id, fullName, avatarUrl, email),
            receiver:Profile!receiver_id(id, fullName, avatarUrl, email)
          `)
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('createdat', { ascending: false });

        if (conversationsError) throw conversationsError;

        // Load pending invitations count
        const { count, error: invitationsError } = await supabase
          .from('CollaborationInvitations')
          .select('*', { count: 'exact', head: true })
          .eq('inviteeId', user.id)
          .eq('status', 'pending');

        if (invitationsError) throw invitationsError;

        setPendingInvitations(count || 0);

        // Transform conversations data
        const transformedConversations = conversationsData?.reduce((acc: Conversation[], msg: any) => {
          const otherUser = msg.sender_id === user.id ? msg.receiver : msg.sender;
          const existingConversation = acc.find(c => c.other_user.id === otherUser.id);

          if (existingConversation) {
            return acc;
          }

          acc.push({
            id: msg.id,
            other_user: {
              id: otherUser.id,
              fullName: otherUser.fullName,
              avatarUrl: otherUser.avatarUrl,
              email: otherUser.email
            },
            last_message: {
              id: msg.id,
              content: msg.content,
              createdat: msg.createdat,
              sender_id: msg.sender_id,
              receiver_id: msg.receiver_id
            }
          });

          return acc;
        }, []) || [];

        setConversations(transformedConversations);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load conversations');
      } finally {
        setLoading(false);
      }
    }

    loadData();
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
            {pendingInvitations > 0 && (
              <Link
                href="/invitations"
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                {pendingInvitations} Pending Invitation{pendingInvitations !== 1 ? 's' : ''}
              </Link>
            )}
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
                href={`/chat/${conversation.other_user.id}`}
                className="block hover:bg-slate-50 transition-colors"
              >
                <div className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                    {conversation.other_user.avatarUrl ? (
                      <Image
                        src={conversation.other_user.avatarUrl}
                        alt={conversation.other_user.fullName || 'User'}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600 text-lg">
                        {conversation.other_user.fullName?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold text-slate-900 truncate">
                      {conversation.other_user.fullName || 'User'}
                    </h2>
                    {conversation.last_message && (
                      <p className="text-sm text-slate-600 truncate">
                        {conversation.last_message.content}
                      </p>
                    )}
                  </div>
                  {conversation.last_message && (
                    <div className="text-xs text-slate-500 flex-shrink-0">
                      {new Date(conversation.last_message.createdat).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-black flex justify-around py-3 shadow-lg">
        <Link
          href="/feed"
          className="flex flex-col items-center transition-colors duration-200 text-black hover:text-gray-600"
        >
          <Home className="w-5 h-5" />
          <span className="text-sm mt-1">Feed</span>
        </Link>
        <Link
          href="/"
          className="flex flex-col items-center transition-colors duration-200 text-black hover:text-gray-600"
        >
          <Search className="w-5 h-5" />
          <span className="text-sm mt-1">Explore</span>
        </Link>
        <Link
          href="/create-project"
          className="flex flex-col items-center transition-colors duration-200 text-emerald-600 hover:text-emerald-700"
        >
          <div className="w-7 h-7 bg-emerald-600 rounded-full flex items-center justify-center -mt-2 shadow-lg hover:bg-emerald-700 transition-colors duration-200">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="text-sm mt-1">Create</span>
        </Link>
        <Link
          href="/profile"
          className="flex flex-col items-center transition-colors duration-200 text-black hover:text-gray-600"
        >
          <User className="w-5 h-5" />
          <span className="text-sm mt-1">Profile</span>
        </Link>
        <Link
          href="/invitations"
          className="flex flex-col items-center transition-colors duration-200 text-emerald-600 relative"
        >
          <MessageSquare className="w-5 h-5" />
          {pendingInvitations > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {pendingInvitations}
            </span>
          )}
          <span className="text-sm mt-1">Chat</span>
        </Link>
      </nav>
    </div>
  );
} 