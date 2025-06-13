'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import ChatBox from '@/components/ChatBox';
import Link from 'next/link';
import { Home, User, MessageSquare } from 'lucide-react';

interface UserProfile {
  id: string;
  fullName: string;
  avatar_url: string | null;
}

export default function ChatPage({ params }: { params: { userId: string } }) {
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const { user } = useAuth();

  useEffect(() => {
    async function loadUserProfile() {
      try {
        const { data: profile, error } = await supabase
          .from('Profile')
          .select('*')
          .eq('id', params.userId)
          .single();

        if (error) throw error;
        if (!profile) throw new Error('User not found');

        setOtherUser({
          id: profile.id,
          fullName: profile.fullName ?? '',
          avatar_url: profile.avatarUrl
        } as UserProfile);
        setError(null);
      } catch (err) {
        console.error('Error loading user profile:', err);
        setError('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    }

    loadUserProfile();
  }, [params.userId, supabase]);

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
        <div className="text-slate-600">Loading chat...</div>
      </div>
    );
  }

  if (error || !otherUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">Error</h1>
          <p className="text-slate-600">{error || 'User not found'}</p>
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
            <h1 className="text-xl font-semibold text-slate-900">Chat</h1>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm h-[calc(100vh-12rem)]">
          <ChatBox
            otherUserId={otherUser.id}
            otherUserName={otherUser.fullName}
            otherUserAvatar={otherUser.avatar_url}
          />
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