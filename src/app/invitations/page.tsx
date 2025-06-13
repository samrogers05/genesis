'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, User, MessageSquare, Search, Check, X } from 'lucide-react';
import Image from 'next/image';

interface Invitation {
  id: string;
  projectId: string;
  inviterId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  project: {
    id: string;
    name: string;
    description: string;
    photo: string | null;
  };
  inviter: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  };
}

interface SupabaseInvitation {
  id: string;
  projectId: string;
  inviterId: string;
  status: string;
  createdAt: string;
  project: {
    id: string;
    name: string;
    description: string;
    photo: string | null;
  };
  inviter: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  };
}

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    async function loadInvitations() {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('CollaborationInvitations')
          .select(`
            id,
            projectId,
            inviterId,
            status,
            createdAt,
            project:Project(id, name, description, photo),
            inviter:Profile!inviterId(id, fullName, avatarUrl)
          `)
          .eq('inviteeId', user.id)
          .eq('status', 'pending')
          .order('createdAt', { ascending: false });

        if (error) throw error;

        // Transform the data to match our expected structure
        const transformedData: Invitation[] = (data || []).map((inv: any) => ({
          id: inv.id,
          projectId: inv.projectId,
          inviterId: inv.inviterId,
          status: inv.status as 'pending' | 'accepted' | 'rejected',
          createdAt: inv.createdAt,
          project: {
            id: inv.project.id,
            name: inv.project.name,
            description: inv.project.description,
            photo: inv.project.photo
          },
          inviter: {
            id: inv.inviter.id,
            fullName: inv.inviter.fullName,
            avatarUrl: inv.inviter.avatarUrl
          }
        }));

        setInvitations(transformedData);
      } catch (err) {
        console.error('Error loading invitations:', err);
        setError('Failed to load invitations');
      } finally {
        setLoading(false);
      }
    }

    loadInvitations();
  }, [user, supabase]);

  const handleInvitationResponse = async (invitationId: string, accept: boolean) => {
    if (!user) return;

    try {
      setLoading(true);

      // Update invitation status
      const { error: updateError } = await supabase
        .from('CollaborationInvitations')
        .update({ status: accept ? 'accepted' : 'rejected' })
        .eq('id', invitationId)
        .eq('inviteeId', user.id);

      if (updateError) throw updateError;

      if (accept) {
        // Get the invitation details to add the collaborator
        const { data: invitation, error: fetchError } = await supabase
          .from('CollaborationInvitations')
          .select('projectId')
          .eq('id', invitationId)
          .single();

        if (fetchError) throw fetchError;

        // Add the user as a collaborator
        const { error: collaboratorError } = await supabase
          .from('Collaborators')
          .insert({
            projectId: invitation.projectId,
            profileId: user.id
          });

        if (collaboratorError) throw collaboratorError;
      }

      // Remove the invitation from the list
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
    } catch (err) {
      console.error('Error responding to invitation:', err);
      setError('Failed to respond to invitation');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading invitations...</div>
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
    <div className="min-h-screen bg-stone-50 font-serif text-slate-900">
      <style dangerouslySetInnerHTML={{
        __html: `
          @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=Inter:wght@400;500;600&display=swap');
          * {
            font-family: 'Crimson Text', serif;
          }
          .sans {
            font-family: 'Inter', sans-serif;
          }
        `
      }} />
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-8 py-6">
          <h1 className="text-3xl font-bold text-slate-900">Collaboration Invitations</h1>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-8 py-8 pb-32">
        {invitations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600 text-lg">No pending invitations</p>
          </div>
        ) : (
          <div className="space-y-6">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start gap-4">
                  {/* Project Photo */}
                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                    {invitation.project.photo ? (
                      <Image
                        src={invitation.project.photo}
                        alt={invitation.project.name}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Project Info */}
                  <div className="flex-1">
                    <Link href={`/project/${invitation.project.id}`} className="block">
                      <h2 className="text-xl font-semibold text-slate-900 hover:text-emerald-600 transition-colors">
                        {invitation.project.name}
                      </h2>
                    </Link>
                    <p className="text-slate-600 mt-1">{invitation.project.description}</p>
                    
                    {/* Inviter Info */}
                    <div className="flex items-center gap-2 mt-4">
                      <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                        {invitation.inviter.avatarUrl ? (
                          <Image
                            src={invitation.inviter.avatarUrl}
                            alt={invitation.inviter.fullName}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-600 text-sm">
                            {invitation.inviter.fullName?.charAt(0) || '?'}
                          </div>
                        )}
                      </div>
                      <span className="text-slate-600">
                        Invited by {invitation.inviter.fullName}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 mt-6">
                      <button
                        onClick={() => handleInvitationResponse(invitation.id, true)}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        Accept
                      </button>
                      <button
                        onClick={() => handleInvitationResponse(invitation.id, false)}
                        className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
          {invitations.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {invitations.length}
            </span>
          )}
          <span className="text-sm mt-1">Chat</span>
        </Link>
      </nav>
    </div>
  );
} 