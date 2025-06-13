"use client";

import React, { useState, useEffect } from "react";
import { Home, Search, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import Image from "next/image";

interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  signalBoosts?: number;
  creator: {
    id: string;
    fullName: string | null;
    avatarUrl: string | null;
  }[];
  projectTags: {
    tagId: string;
    Tags: {
      name: string;
    };
  }[];
}

interface SupabaseProject {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  signalBoosts: number | null;
  creator: Array<{
    id: string;
    fullName: string | null;
    avatarUrl: string | null;
  }>;
}

interface SupabaseChange {
  id: string;
  createdAt: string;
  description: string;
  projectId: string;
  Project: Array<{
    name: string | null;
    creator: Array<{
      id: string;
      fullName: string | null;
      avatarUrl: string | null;
    }>;
  }>;
}

interface SupabasePublicationFetch {
  id: string;
  createdAt: string;
  title: string;
  abstract: string | null;
  projectId: string;
  profile: Array<{
    id: string;
    fullName: string | null;
    avatarUrl: string | null;
  }>;
  Project: Array<{
    name: string | null;
    creator: Array<{
      id: string;
      fullName: string | null;
      avatarUrl: string | null;
    }>;
  }>;
}

interface FeedItem {
  id: string;
  type: 'project_update' | 'new_project' | 'trending' | 'new_publication';
  name: string;
  detail: string;
  time: string;
  signalBoosts?: number;
  boosted?: boolean;
  projectId?: string;
  creator?: {
    id: string;
    fullName: string | null;
    avatarUrl: string | null;
  };
}

export default function Feed() {
  const [loading, setLoading] = useState(true);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [dailySignalBoosts, setDailySignalBoosts] = useState(5);
  const [boostedItems, setBoostedItems] = useState(new Set<string>());
  const pathname = usePathname();
  const { user } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;

    async function loadFeed() {
      setLoading(true);
      try {
        // Get user's daily signal boosts
        const { data: profile, error: profileError } = await supabase
          .from('Profile')
          .select('dailySignalBoosts')
          .eq('id', user?.id)
          .single();

        if (profileError) throw profileError;
        setDailySignalBoosts(profile.dailySignalBoosts);

        // Get user's boosted items
        const { data: boosts, error: boostsError } = await supabase
          .from('SignalBoosts')
          .select('projectId')
          .eq('userId', user?.id);

        if (boostsError) throw boostsError;
        
        // Create a Set of boosted item IDs, considering both new_project and trending item IDs
        const initialBoostedItems = new Set<string>();
        boosts.forEach(boost => {
          initialBoostedItems.add(boost.projectId); // For new_project type IDs
          initialBoostedItems.add(`trending-${boost.projectId}`); // For trending type IDs
        });
        setBoostedItems(initialBoostedItems);

        // Fetch recent projects
        const { data: projects, error: projectsError } = await supabase
          .from('Project')
          .select(`
            id,
            name,
            description,
            createdAt,
            signalBoosts,
            creator:Profile!Project_createdBy_fkey (
              id,
              fullName,
              avatarUrl
            )
          `) as { data: SupabaseProject[], error: any };

        if (projectsError) throw projectsError;

        // Transform projects into feed items
        const items: FeedItem[] = projects.map(project => {
          const creatorData = (Array.isArray(project.creator) && project.creator.length > 0)
            ? (project.creator[0] as unknown as { id: string; fullName: string | null; avatarUrl: string | null; })
            : null;
          return {
            id: project.id,
            type: 'new_project' as const,
            name: project.name,
            detail: project.description,
            time: new Date(project.createdAt).toLocaleString(),
            projectId: project.id,
            signalBoosts: project.signalBoosts || 0,
            boosted: initialBoostedItems.has(project.id),
            creator: creatorData ? {
              id: creatorData.id,
              fullName: creatorData.fullName,
              avatarUrl: creatorData.avatarUrl
            } : undefined
          };
        });

        // Fetch trending projects (based on signalBoosts)
        const { data: trendingProjects, error: trendingError } = await supabase
          .from('Project')
          .select(`
            id,
            name,
            description,
            createdAt,
            signalBoosts,
            creator:Profile!Project_createdBy_fkey (
              id,
              fullName,
              avatarUrl
            )
          `) as { data: SupabaseProject[], error: any };

        if (trendingError) throw trendingError;

        // Add trending items
        const trendingItems: FeedItem[] = trendingProjects.map(project => {
          const creatorData = (Array.isArray(project.creator) && project.creator.length > 0)
            ? (project.creator[0] as unknown as { id: string; fullName: string | null; avatarUrl: string | null; })
            : null;
          return {
            id: `trending-${project.id}`,
            type: 'trending' as const,
            name: project.name,
            detail: project.description,
            time: new Date(project.createdAt).toLocaleString(),
            signalBoosts: project.signalBoosts || 0,
            boosted: initialBoostedItems.has(`trending-${project.id}`),
            projectId: project.id,
            creator: creatorData ? {
              id: creatorData.id,
              fullName: creatorData.fullName,
              avatarUrl: creatorData.avatarUrl
            } : undefined
          };
        });

        // Fetch recent changes (updates)
        const { data: changes, error: changesError } = await supabase
          .from('Change')
          .select(`
            id,
            createdAt,
            description,
            projectId,
            Project(name, creator:Profile!Project_createdBy_fkey(id, fullName, avatarUrl))
          `) as { data: SupabaseChange[], error: any };

        if (changesError) throw changesError;

        const changeItems: FeedItem[] = changes.map(change => {
          const projectData = Array.isArray(change.Project) && change.Project.length > 0 ? change.Project[0] : null;
          const creatorData = 
            (projectData && Array.isArray(projectData.creator) && projectData.creator.length > 0)
              ? (projectData.creator[0] as unknown as { id: string; fullName: string | null; avatarUrl: string | null; })
              : null;
          return {
            id: `change-${change.id}`,
            type: 'project_update' as const,
            name: `Update on ${projectData?.name || 'a project'}`,
            detail: change.description,
            time: new Date(change.createdAt).toLocaleString(),
            projectId: change.projectId,
            creator: creatorData ? {
              id: creatorData.id,
              fullName: creatorData.fullName,
              avatarUrl: creatorData.avatarUrl,
            } : undefined,
          };
        });

        // Fetch recent publications
        const { data: publications, error: publicationsError } = await supabase
          .from('Publications')
          .select(`
            id,
            createdAt,
            title,
            abstract,
            projectId,
            profile:Profile!profileId(id, fullName, avatarUrl),
            Project(name, creator:Profile!Project_createdBy_fkey(id, fullName, avatarUrl))
          `) as { data: SupabasePublicationFetch[], error: any };

        if (publicationsError) throw publicationsError;

        const publicationItems: FeedItem[] = publications.map(publication => {
          const projectData = Array.isArray(publication.Project) && publication.Project.length > 0 ? publication.Project[0] : null;
          const authorData = 
            (Array.isArray(publication.profile) && publication.profile.length > 0)
              ? (publication.profile[0] as unknown as { id: string; fullName: string | null; avatarUrl: string | null; })
              : null;
          return {
            id: `publication-${publication.id}`,
            type: 'new_publication' as const,
            name: `New Publication: ${publication.title}`,
            detail: publication.abstract || `From project ${projectData?.name || 'a project'}`,
            time: new Date(publication.createdAt).toLocaleString(),
            projectId: publication.projectId,
            creator: authorData ? {
              id: authorData.id,
              fullName: authorData.fullName,
              avatarUrl: authorData.avatarUrl,
            } : undefined,
          };
        });

        // Combine all latest updates and sort by time
        const latestUpdates = [...items, ...changeItems, ...publicationItems].sort((a, b) => {
          return new Date(b.time).getTime() - new Date(a.time).getTime();
        });

        // Add console.log to debug the data
        console.log('Projects data:', projects);
        console.log('Changes data:', changes);
        console.log('Publications data:', publications);
        console.log('Feed items (combined):', [...latestUpdates, ...trendingItems]);

        setFeedItems([...latestUpdates, ...trendingItems]);
      } catch (error) {
        console.error('Error loading feed:', error);
      } finally {
        setLoading(false);
      }
    }

    loadFeed();

    // Set up real-time subscription for new projects
    const subscription = supabase
      .channel('public:Project')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'Project' }, payload => {
        const newProject = payload.new as Project;
        setFeedItems(prev => [{
          id: newProject.id,
          type: 'new_project',
          name: `New Project: ${newProject.name}`,
          detail: newProject.description,
          time: new Date(newProject.createdAt).toLocaleString(),
          projectId: newProject.id,
          signalBoosts: newProject.signalBoosts || 0,
          boosted: false,
          creator: newProject.creator && newProject.creator.length > 0 ? {
            id: newProject.creator[0].id,
            fullName: newProject.creator[0].fullName,
            avatarUrl: newProject.creator[0].avatarUrl,
          } : undefined,
        }, ...prev]);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, supabase]);

  const handleSignalBoost = async (itemId: string) => {
    if (!user) return;
    
    const projectId = feedItems.find(item => item.id === itemId)?.projectId;
    if (!projectId) return;

    // Optimistically update UI
    setDailySignalBoosts(prev => prev - 1);
    setBoostedItems(prev => new Set([...prev, itemId]));
    setFeedItems(prev => prev.map(item => 
      item.projectId === projectId 
        ? { ...item, signalBoosts: (item.signalBoosts || 0) + 1, boosted: true }
        : item
    ));

    try {
      const { data, error } = await supabase.rpc('handle_signal_boost', {
        user_id: user.id,
        project_id: projectId
      });

      console.log('Supabase RPC response - data:', data);
      console.log('Supabase RPC response - error:', error);

      if (error || !data) {
        // Revert UI if there's an error or boost was not successful (e.g., no boosts left, already boosted)
        setDailySignalBoosts(prev => prev + 1);
        setBoostedItems(prev => new Set([...Array.from(prev)].filter(id => id !== itemId)));
        setFeedItems(prev => prev.map(item => 
          item.projectId === projectId 
            ? { ...item, signalBoosts: (item.signalBoosts || 0) - 1, boosted: false }
            : item
        ));
        console.error('Error boosting item or boost not allowed:', error);
      }
    } catch (error) {
      // Revert UI for unexpected errors
      setDailySignalBoosts(prev => prev + 1);
      setBoostedItems(prev => new Set([...Array.from(prev)].filter(id => id !== itemId)));
      setFeedItems(prev => prev.map(item => 
        item.projectId === projectId 
          ? { ...item, signalBoosts: (item.signalBoosts || 0) - 1, boosted: false }
          : item
      ));
      console.error('Unexpected error boosting item:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-white font-sans text-gray-900">
        <header className="flex items-center justify-between px-4 py-3 border-b border-black bg-white uppercase tracking-wide">
          <div className="flex items-center gap-3">
            <h1 className="text-md font-bold">Genesis</h1>
            <span className="text-xs text-gray-600 font-medium tracking-wider">Where Breakthroughs Begin</span>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-lg">Loading feed...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900">Genesis</h1>
              <span className="text-sm text-slate-500 font-medium">Where Breakthroughs Begin</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-sm font-medium text-emerald-700">{dailySignalBoosts} Boosts Left</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-20">
        {/* Featured Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Featured Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {feedItems
              .filter(item => item.type === 'trending')
              .slice(0, 3)
              .map((item) => (
                <Link
                  key={item.id}
                  href={`/project/${item.projectId}`}
                  className="group relative overflow-hidden rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="aspect-w-16 aspect-h-9 bg-slate-100">
                    {/* Add project image here if available */}
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">
                        Trending
                      </span>
                      <span className="text-sm text-slate-500">
                        {new Date(item.time).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors">
                      {item.name.replace('Trending: ', '')}
                    </h3>
                    <p className="text-slate-600 line-clamp-2">{item.detail}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                        <span className="text-sm font-medium text-slate-700">{item.creator?.fullName || 'Anonymous'}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleSignalBoost(item.id);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          item.boosted
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-700 hover:bg-emerald-100 hover:text-emerald-700'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        {item.signalBoosts}
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </section>

        {/* Latest Updates */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Latest Updates</h2>
          <div className="space-y-6">
            {feedItems
              .filter(item => item.type === 'new_project' || item.type === 'project_update' || item.type === 'new_publication')
              .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
              .slice(0, 5) // Display top 5 latest updates
              .map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                          {item.creator?.avatarUrl ? (
                            <Image
                              src={item.creator.avatarUrl}
                              alt={item.creator.fullName || 'Creator'}
                              width={40}
                              height={40}
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-600 text-base">
                              {item.creator?.fullName?.charAt(0) || '?'}
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-900">{item.creator?.fullName || 'Anonymous'}</h3>
                          <p className="text-sm text-slate-500">{new Date(item.time).toLocaleDateString()}</p>
                        </div>
                      </div>
                      {item.type === 'new_project' && (
                        <button
                          onClick={() => handleSignalBoost(item.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                            item.boosted
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-700 hover:bg-emerald-100 hover:text-emerald-700'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          {item.signalBoosts}
                        </button>
                      )}
                      {(item.type === 'project_update' || item.type === 'new_publication') && item.projectId && (
                        <Link
                          href={`/project/${item.projectId}`}
                          className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                        >
                          View Project
                        </Link>
                      )}
                    </div>
                    <h4 className="text-lg font-semibold text-slate-900 mb-2">
                      {item.name.replace('New Project: ', '').replace('Update on ', '').replace('New Publication: ', '')}
                    </h4>
                    <p className="text-slate-600">{item.detail}</p>
                  </div>
                </div>
              ))}
          </div>
        </section>

        {/* Trending Projects */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Trending Now</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {feedItems
              .filter(item => item.type === 'trending')
              .slice(0, 3) // Display top 3 trending projects in the featured section already
              .map((item) => (
                <Link
                  key={item.id}
                  href={`/project/${item.projectId}`}
                  className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">
                        Trending
                      </span>
                      <span className="text-sm text-slate-500">
                        {new Date(item.time).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors">
                      {item.name.replace('Trending: ', '')}
                    </h3>
                    <p className="text-slate-600 line-clamp-2 mb-4">{item.detail}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                        <span className="text-sm font-medium text-slate-700">{item.creator?.fullName || 'Anonymous'}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleSignalBoost(item.id);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          item.boosted
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-700 hover:bg-emerald-100 hover:text-emerald-700'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        {item.signalBoosts}
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </section>
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-slate-200 flex justify-around py-3 shadow-lg">
        <Link
          href="/feed"
          className="flex flex-col items-center transition-colors duration-200 text-emerald-600"
        >
          <Home className="w-5 h-5" />
          <span className="text-sm mt-1">Feed</span>
        </Link>
        <Link
          href="/"
          className="flex flex-col items-center transition-colors duration-200 text-slate-600 hover:text-slate-900"
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
          className="flex flex-col items-center transition-colors duration-200 text-slate-600 hover:text-slate-900"
        >
          <User className="w-5 h-5" />
          <span className="text-sm mt-1">Profile</span>
        </Link>
      </nav>
    </div>
  );
}
