'use client';

import { useState, useEffect } from "react";
import { Home, Search, User, MapPin, Beaker, Target, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Image from "next/image";

interface ProfileData {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
  researchProject: string | null;
  keyQuestion: string | null;
  about: string | null;
  location: string | null;
  organization: string | null;
  labAffiliation: string | null;
  email: string | null;
  publications: number | null;
  citations: number | null;
  collaborations: number | null;
  hot: boolean | null;
  tags: string[];
}

interface ProjectData {
  id: string;
  name: string;
  description: string;
  photo: string | null;
  createdAt: string;
  signalBoosts: number;
  creator: {
    id: string;
    fullName: string;
    avatarUrl: string;
  };
}

export default function PublicProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();
  const { userId } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [userProjects, setUserProjects] = useState<ProjectData[]>([]);

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);

      if (!userId) {
        setError("User ID not provided.");
        setLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('Profile')
        .select('*, profileTags(tagId, Tags(name))')
        .eq('id', userId)
        .single();

      if (profileError && profileError.code === 'PGRST116') {
        setError("Profile not found.");
        setLoading(false);
        return;
      } else if (profileError) {
        console.error('Error fetching profile:', profileError);
        setError('Failed to load profile');
        setLoading(false);
        return;
      }
      
      const transformedProfile = {
        ...profile,
        tags: profile.profileTags.map((pt: any) => pt.Tags.name),
        fullName: profile.fullName,
        avatarUrl: profile.avatarUrl,
        researchProject: profile.researchProject,
        keyQuestion: profile.keyQuestion,
        about: profile.about,
        location: profile.location,
        organization: profile.organization,
        labAffiliation: profile.labAffiliation,
        email: profile.email,
        publications: profile.publications,
        citations: profile.citations,
        collaborations: profile.collaborations,
        hot: profile.hot,
      };

      setProfileData(transformedProfile);

      // Fetch user's projects
      const { data: projects, error: projectsError } = await supabase
        .from('Project')
        .select(`
          id,
          name,
          description,
          photo,
          createdAt,
          signalBoosts,
          creator:Profile(id, fullName, avatarUrl)
        `)
        .eq('createdBy', userId)
        .order('createdAt', { ascending: false });

      if (projectsError) {
        console.error('Error fetching user projects:', projectsError);
      } else {
        // Transform projects to match ProjectData interface
        const transformedProjects = projects.map((project: any) => ({
          ...project,
          creator: project.creator ? project.creator[0] : null, // Ensure creator is an object, not an array
        }));
        setUserProjects(transformedProjects);
      }

      setLoading(false);
    }

    loadProfile();
  }, [userId, supabase]);

  const handleCollaborate = () => {
    if (!userId) return;
    router.push(`/chat/${userId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading profile...</div>
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

  if (!profileData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">Profile Not Found</h1>
          <p className="text-slate-600">The requested profile could not be loaded.</p>
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
            <h1 className="text-xl font-semibold text-slate-900">Profile</h1>
            {user && user.id !== userId && (
              <button
                onClick={handleCollaborate}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-semibold shadow-md hover:bg-emerald-700 transition-colors duration-200 flex items-center gap-2"
              >
                <MessageSquare className="w-5 h-5" />
                Collaborate
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Profile Header Section */}
          <div className="relative p-8 bg-gradient-to-r from-emerald-500 to-green-600 text-white">
            {/* Avatar display */}
            <div className="relative w-24 h-24 mx-auto rounded-full border-4 border-white shadow-lg overflow-hidden">
              {profileData.avatarUrl ? (
                <img src={profileData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-300 flex items-center justify-center text-slate-600 text-4xl font-bold">
                  {profileData.fullName ? profileData.fullName[0] : ''}
                </div>
              )}
            </div>

            <h1 className="text-3xl font-bold text-center mt-4">{profileData.fullName}</h1>
            <p className="text-center text-emerald-100">{profileData.email}</p>

            {/* Quick Stats */}
            <div className="flex justify-around items-center text-sm mt-6">
              <div className="text-center">
                <p className="font-bold text-lg">{profileData.publications}</p>
                <p className="text-emerald-100">Publications</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-lg">{profileData.citations}</p>
                <p className="text-emerald-100">Citations</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-lg">{profileData.collaborations}</p>
                <p className="text-emerald-100">Collaborations</p>
              </div>
            </div>
          </div>

          {/* Profile Details Section */}
          <div className="p-8 space-y-8">
            {/* About Section */}
            <div>
              <h2 className="text-xl font-semibold text-slate-800 mb-4">About</h2>
              <p className="text-slate-700 leading-relaxed">
                {profileData.about || 'No information available.'}
              </p>
            </div>

            {/* Research Focus Section */}
            <div>
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Research Focus</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-slate-700 flex items-center mb-2">
                    <Target className="w-5 h-5 text-emerald-600 mr-2" />
                    Research Project
                  </h3>
                  <p className="text-slate-700">
                    {profileData.researchProject || 'Not specified.'}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-slate-700 flex items-center mb-2">
                    <Beaker className="w-5 h-5 text-emerald-600 mr-2" />
                    Key Question
                  </h3>
                  <p className="text-slate-700">
                    {profileData.keyQuestion || 'Not specified.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Details Section */}
            <div>
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-slate-700 flex items-center mb-2">
                    <MapPin className="w-5 h-5 text-emerald-600 mr-2" />
                    Location
                  </h3>
                  <p className="text-slate-700">{profileData.location || 'Not specified.'}</p>
                </div>
                <div>
                  <h3 className="font-medium text-slate-700 flex items-center mb-2">
                    <Home className="w-5 h-5 text-emerald-600 mr-2" />
                    Organization
                  </h3>
                  <p className="text-slate-700">
                    {profileData.organization || 'Not specified.'}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-slate-700 flex items-center mb-2">
                    <Beaker className="w-5 h-5 text-emerald-600 mr-2" />
                    Lab Affiliation
                  </h3>
                  <p className="text-slate-700">
                    {profileData.labAffiliation || 'Not specified.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Tags Section */}
            <div>
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {profileData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* My Projects Section */}
            <section>
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Projects</h2>
              {userProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userProjects.map((project) => (
                    <Link href={`/project/${project.id}`} key={project.id} className="block group">
                      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                        <div className="w-full h-40 relative bg-slate-100 flex items-center justify-center overflow-hidden">
                          {project.photo ? (
                            <Image
                              src={project.photo}
                              alt={project.name}
                              layout="fill"
                              objectFit="cover"
                              className="group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="text-slate-400 text-lg">No Image</div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="text-lg font-semibold text-slate-900 mb-1 group-hover:text-emerald-600 transition-colors duration-200">
                            {project.name}
                          </h3>
                          <p className="text-sm text-slate-600 line-clamp-2">{project.description}</p>
                          <div className="flex items-center text-xs text-slate-500 mt-2">
                            <span>{project.signalBoosts || 0} boosts</span>
                            <span className="mx-2">•</span>
                            <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-slate-600 italic">This user hasn't created any projects yet.</p>
              )}
            </section>
          </div>
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
              href="/feed"
              className="flex flex-col items-center justify-center text-slate-600 hover:text-slate-900"
            >
              <Search className="w-6 h-6" />
              <span className="text-xs mt-1">Feed</span>
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
              className="flex flex-col items-center justify-center text-slate-600 hover:text-slate-900"
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