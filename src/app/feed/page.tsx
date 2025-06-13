"use client";

import React, { useState, useEffect } from "react";
import { Home, Search, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface Project {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  signalBoosts?: number;
  creator: {
    id: string;
    fullName: string;
    avatarUrl: string;
  };
  projectTags: {
    tagId: string;
    Tags: {
      name: string;
    };
  }[];
}

interface FeedItem {
  id: string;
  type: 'project_update' | 'new_project' | 'trending';
  title: string;
  detail: string;
  time: string;
  signalBoosts?: number;
  boosted?: boolean;
  projectId?: string;
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
            *,
            creator:Profile(id, fullName, avatarUrl),
            projectTags(tagId, Tags(name))
          `)
          .order('createdAt', { ascending: false })
          .limit(10);

        if (projectsError) throw projectsError;

        // Transform projects into feed items
        const items: FeedItem[] = projects.map(project => ({
          id: project.id,
          type: 'new_project',
          title: `New Project: ${project.title}`,
          detail: project.description,
          time: new Date(project.createdAt).toLocaleString(),
          projectId: project.id,
          signalBoosts: project.signalBoosts || 0,
          boosted: initialBoostedItems.has(project.id)
        }));

        // Fetch trending projects (based on signalBoosts)
        const { data: trendingProjects, error: trendingError } = await supabase
          .from('Project')
          .select(`
            *,
            creator:Profile(id, fullName, avatarUrl),
            projectTags(tagId, Tags(name))
          `)
          .order('signalBoosts', { ascending: false })
          .limit(5);

        if (trendingError) throw trendingError;

        // Add trending items
        const trendingItems: FeedItem[] = trendingProjects.map(project => ({
          id: `trending-${project.id}`,
          type: 'trending',
          title: `Trending: ${project.title}`,
          detail: project.description,
          time: new Date(project.createdAt).toLocaleString(),
          signalBoosts: project.signalBoosts || 0,
          boosted: initialBoostedItems.has(`trending-${project.id}`),
          projectId: project.id
        }));

        setFeedItems([...items, ...trendingItems]);
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
          title: `New Project: ${newProject.title}`,
          detail: newProject.description,
          time: new Date(newProject.createdAt).toLocaleString(),
          projectId: newProject.id,
          signalBoosts: newProject.signalBoosts || 0,
          boosted: false
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
    <div className="flex flex-col min-h-screen bg-white font-sans text-gray-900">
      <header className="flex items-center justify-between px-4 py-3 border-b border-black bg-white uppercase tracking-wide">
        <div className="flex items-center gap-3">
          <h1 className="text-md font-bold">Genesis</h1>
          <span className="text-xs text-gray-600 font-medium tracking-wider">Where Breakthroughs Begin</span>
        </div>
        <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
          {dailySignalBoosts} Signal Boosts Left
        </div>
      </header>

      <div className="flex-1 p-6 space-y-6 pb-32">
        {feedItems.map((item) => (
          <div
            key={item.id}
            className={`p-4 rounded-lg border ${
              item.boosted
                ? 'bg-emerald-50 border-emerald-400'
                : item.type === 'trending' 
                ? 'border-l-4 border-orange-400 bg-orange-50 hover:bg-orange-100' 
                : 'border-gray-200 bg-white hover:border-blue-500 hover:shadow-md'
            } transition duration-200`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="font-medium text-md">{item.title}</div>
                <div className="text-sm text-gray-700">{item.detail}</div>
                <div className="text-xs text-gray-500 mt-1 flex items-center gap-3">
                  <span>{item.time}</span>
                  {item.signalBoosts !== undefined && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12,2L15.09,8.26L22,9L17,14L18.18,21L12,17.77L5.82,21L7,14L2,9L8.91,8.26L12,2Z"/>
                      </svg>
                      {item.signalBoosts} signalBoosts
                    </span>
                  )}
                </div>
              </div>
              {item.type === 'trending' && (
                <button
                  onClick={() => handleSignalBoost(item.id)}
                  disabled={dailySignalBoosts === 0 || boostedItems.has(item.id)}
                  className={`ml-3 px-3 py-1 text-xs rounded transition-all duration-200 ${item.boosted ? 'bg-green-500 text-white cursor-not-allowed' : (dailySignalBoosts === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-orange-500 text-white hover:bg-orange-600 active:scale-95')}`}
                >
                  {item.boosted ? '✓ Boosted' : 'Signal Boost'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <nav className="fixed bottom-0 w-full bg-white border-t border-black flex justify-around py-3 shadow-lg">
        <Link
          href="/feed"
          className={`flex flex-col items-center transition-colors duration-200 ${pathname === "/feed" ? "text-blue-600" : "text-black hover:text-gray-600"}`}
        >
          <Home className="w-5 h-5" />
          <span className="text-xs mt-1">Feed</span>
        </Link>
        <Link
          href="/"
          className={`flex flex-col items-center transition-colors duration-200 ${pathname === "/" ? "text-blue-600" : "text-black hover:text-gray-600"}`}
        >
          <Search className="w-5 h-5" />
          <span className="text-xs mt-1">Explore</span>
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
          <span className="text-xs mt-1">Create</span>
        </Link>
        <Link
          href="/profile"
          className={`flex flex-col items-center transition-colors duration-200 ${pathname === "/profile" ? "text-blue-600" : "text-black hover:text-gray-600"}`}
        >
          <User className="w-5 h-5" />
          <span className="text-xs mt-1">Profile</span>
        </Link>
      </nav>
    </div>
  );
} 