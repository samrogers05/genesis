'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, User, MessageSquare, Search } from 'lucide-react';
import Image from 'next/image';

export default function ProjectPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    async function loadProject() {
      try {
        const { data, error } = await supabase
          .from('Project')
          .select(`
            id,
            name,
            description,
            photo,
            creator:Profile(id, fullName, avatarUrl, email),
            Collaborators(Profile(id, fullName, avatarUrl, email))
          `)
          .eq('id', params.id)
          .single();

        const creator = data?.creator as unknown as { id: string; fullName: string; avatarUrl: string; email: string};
        const creatorName = creator.fullName;
        const creatorid = creator.id;
        const creatorUrl = creator.avatarUrl;
        const creatorEmail = creator.email;

        if (error) throw error;

        console.log('Project data:', data);

        // Transform the data to match our expected structure
        const transformedData = {
          id: data.id,
          name: data.name,
          description: data.description,
          photo: data.photo || null,
          creatorName: creatorName,
          creatorUrl: creatorUrl,
          creatorid: creatorid,
          creatorEmail: creatorEmail,
          Collaborators: data.Collaborators || []
        };

        setProject(transformedData);
        setError(null);
      } catch (err) {
        console.error('Error loading project:', err);
        setError('Failed to load project');
      } finally {
        setLoading(false);
      }
    }

    loadProject();
  }, [params.id, supabase]);

  const handleCollaborate = () => {
    if (!project?.creatorid) return;
    router.push(`/chat/${project.creatorid}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading project...</div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">Error</h1>
          <p className="text-slate-600">{error || 'Project not found'}</p>
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
      
      {/* Header with Project Photo Banner */}
      <header className="relative h-96 w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 overflow-hidden mb-8 shadow-md">
        {project.photo ? (
          <Image
            src={project.photo}
            alt={project.name}
            layout="fill"
            objectFit="cover"
            priority
            className="z-0"
          />
        ) : (
          <div className="absolute inset-0 z-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600"></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
        
        <div className="relative z-20 flex flex-col justify-end h-full max-w-4xl mx-auto px-8 py-8 text-white">
          <h1 className="text-5xl font-bold mb-4 leading-tight">{project.name}</h1>
          <div className="flex items-center gap-4 text-lg text-slate-200">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              <span>{project.creatorName || 'Anonymous'}</span>
            </div>
            {user && user.id !== project.creatorid && (
              <button
                onClick={handleCollaborate}
                className="ml-auto px-6 py-2 bg-white text-emerald-600 rounded-lg font-semibold shadow-md hover:bg-gray-100 transition-colors duration-200 flex items-center gap-2"
              >
                <MessageSquare className="w-5 h-5" />
                Collaborate
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-8 pb-32 w-full space-y-8">
        <section className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">About This Project</h2>
          <p className="text-slate-700 leading-relaxed text-lg">{project.description}</p>
        </section>

        {/* Project Team Section */}
        <section className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6">Project Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* User ID Card */}
            <div className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg shadow-sm bg-emerald-50">
              <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                {project.creator?.avatarUrl ? (
                  <Image
                    src={project.creatorUrl}
                    alt={project.creatorName || 'Creator'}
                    width={56}
                    height={56}
                    objectFit="cover"
                  />
                ) : (
                  <div className="text-slate-600 text-xl font-semibold">
                    {(project.creatorName || 'C').split(' ').map((n: string) => n[0]).join('')}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-lg font-medium text-slate-900">{project.creatorName || 'Anonymous'}</h3>
                <p className="text-sm text-emerald-700 font-semibold">Creator</p>
                {project.creatorEmail && <p className="text-sm text-slate-500">{project.creatorEmail}</p>}
              </div>
            </div>

            {/* Collaborators Cards */}
            {project.Collaborators && project.Collaborators.length > 0 ? (
              project.Collaborators.map((collaborator: any) => (
                <div key={collaborator.profile[0]?.id} className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg shadow-sm bg-white">
                  <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {collaborator.profile[0]?.avatarUrl ? (
                      <Image
                        src={collaborator.profile[0].avatarUrl}
                        alt={collaborator.profile[0].fullName || 'Collaborator'}
                        width={56}
                        height={56}
                        objectFit="cover"
                      />
                    ) : (
                      <div className="text-slate-600 text-xl font-semibold">
                        {(collaborator.profile[0]?.fullName || 'C').split(' ').map((n: string) => n[0]).join('')}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-slate-900">{collaborator.profile[0]?.fullName || 'Collaborator'}</h3>
                    <p className="text-sm text-slate-500">Collaborator</p>
                    {collaborator.profile[0]?.email && <p className="text-sm text-slate-500">{collaborator.profile[0].email}</p>}
                  </div>
                </div>
              ))
            ) : (
              // No additional collaborators, only creator is shown
              <p className="text-slate-500 italic col-span-full">No additional collaborators have been added to this project yet.</p>
            )}
          </div>
        </section>
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-black flex justify-around py-3 shadow-lg">
        <Link
          href="/"
          className="flex flex-col items-center transition-colors duration-200 text-black hover:text-gray-600"
        >
          <Search className="w-5 h-5" />
          <span className="text-sm mt-1">Explore</span>
        </Link>
        <Link
          href="/feed"
          className="flex flex-col items-center transition-colors duration-200 text-black hover:text-gray-600"
        >
          <Home className="w-5 h-5" />
          <span className="text-sm mt-1">Feed</span>
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
          href="/chat"
          className="flex flex-col items-center transition-colors duration-200 text-emerald-600"
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-sm mt-1">Chat</span>
        </Link>
      </nav>
    </div>
  );
} 