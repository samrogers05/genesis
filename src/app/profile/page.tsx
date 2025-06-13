'use client';

// Import necessary dependencies for the profile page
import { useState, useEffect } from "react";
import { Home, Search, User, MapPin, Beaker, Target, Edit2, Camera } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from "next/image";

// Removed mock data for research labs as we are now using Supabase
// const mockLabs = [
//   ...
// ];

// Removed mock data for user updates
// const userUpdates = [
//   ...
// ];

// Removed mock data for category trends
// const categoryTrends = [
//   ...
// ];

// Removed mock data for recommended labs
// const recommendedLabs = [
//   ...
// ];

// Removed sample user profile data as we are now fetching from Supabase
// const userProfile = {
//   ...
// };

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

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [filter, setFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [search, setSearch] = useState("");
  const [dailySignalBoosts, setDailySignalBoosts] = useState(3); // Keeping for now, but not tied to Supabase
  const [boostedItems, setBoostedItems] = useState(new Set()); // Keeping for now, but not tied to Supabase
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]); // To store all available tags from Supabase
  const [userProjects, setUserProjects] = useState<ProjectData[]>([]); // New state for user's projects
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login'); // Redirect to login if not authenticated
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('Profile')
        .select('*, profileTags(tagId, Tags(name))') // Select profile data and related tags
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code === 'PGRST116') { // PGRST116 means no rows found
        router.push('/create-profile'); // Redirect to create profile page if no profile exists
        return;
      } else if (profileError) {
        console.error('Error fetching profile:', profileError);
        // Handle other errors, maybe show a generic error page
        setLoading(false);
        return;
      }
      
      // Transform the fetched profile data to match the expected structure
      const transformedProfile = {
        ...profile,
        tags: profile.profileTags.map((pt: any) => pt.Tags.name), // Extract tag names
        // Directly use Supabase column names
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
        .eq('createdBy', user.id)
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

    async function fetchAllTags() {
      const { data, error } = await supabase.from('Tags').select('name');
      if (!error && data) {
        setAllTags(data.map((t: { name: string }) => t.name).filter(Boolean));
      }
    }

    loadProfile();
    fetchAllTags();
  }, [router, supabase]);

  const handleUpdateProfile = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !profileData) {
      console.error('User not authenticated or profile data missing.');
      setLoading(false);
      return;
    }

    try {
      const updates = {
        id: user.id,
        fullName: profileData.fullName,
        avatarUrl: profileData.avatarUrl,
        researchProject: profileData.researchProject,
        keyQuestion: profileData.keyQuestion,
        about: profileData.about,
        location: profileData.location,
        organization: profileData.organization,
        labAffiliation: profileData.labAffiliation,
        email: profileData.email
      };

      const { error: profileUpdateError } = await supabase
        .from('Profile')
        .upsert(updates, { onConflict: 'id' });

      if (profileUpdateError) {
        throw profileUpdateError;
      }

      // Handle tag updates: delete existing and insert new ones
      await supabase.from('profileTags').delete().eq('profileId', user.id);

      if (profileData.tags && profileData.tags.length > 0) {
        const { data: tagData, error: tagError } = await supabase
          .from('Tags')
          .select('id, name')
          .in('name', profileData.tags);

        if (tagError) {
          throw tagError;
        }

        const profileTagInserts = tagData.map(tag => ({
          profileId: user.id,
          tagId: tag.id
        }));

        const { error: profileTagsInsertError } = await supabase
          .from('profileTags')
          .upsert(profileTagInserts, { onConflict: 'profileId,tagId' });

        if (profileTagsInsertError) {
          throw profileTagsInsertError;
        }
      }

      setIsEditing(false); // Exit edit mode on successful update
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = (tag: string) => {
    if (!profileData) return;
    
    if (profileData.tags.length < 5 && !profileData.tags.includes(tag)) {
      setProfileData(prev => prev ? {
        ...prev,
        tags: [...prev.tags, tag]
      } : null);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!profileData) return;
    
    setProfileData(prev => prev ? {
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    } : null);
  };

  const handleProfileUpdate = (field: string, value: string | number) => {
    if (!profileData) return;
    
    setProfileData(prev => prev ? {
      ...prev,
      [field]: value
    } : null);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!profileData) {
      alert('Profile data is missing. Please try again.');
      return;
    }

    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${profileData.id}-${Math.random()}.${fileExt}`;

      console.log('Attempting to upload file:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        filePath: filePath
      });

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      console.log('File uploaded successfully. Public URL:', publicUrl);

      // Update the profile with the new avatar URL
      const { error: updateError } = await supabase
        .from('Profile')
        .update({ avatarUrl: publicUrl })
        .eq('id', profileData.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        throw new Error(`Profile update failed: ${updateError.message}`);
      }

      // Update the local state
      setProfileData(prev => prev ? {
        ...prev,
        avatarUrl: publicUrl
      } : null);
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      alert(`Error uploading avatar: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-lg font-semibold">Loading profile...</div>;
  }

  if (!profileData) {
    return <div className="flex justify-center items-center h-screen text-lg font-semibold">Profile not found.</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-stone-50 font-serif text-slate-900">
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
      
      <header className="flex items-center justify-between px-8 py-6 border-b-2 border-slate-200 bg-white">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Genesis</h1>
          <span className="text-sm text-slate-600 font-light italic tracking-wide">Where Science Convenes</span>
        </div>
        <div className="flex-1 max-w-lg mx-12">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search laboratories, research, discoveries..."
            className="w-full text-base border border-slate-300 bg-white px-5 py-3 rounded-sm font-light focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-200 transition-all duration-200"
          />
        </div>
        <div className="w-6"></div>
      </header>

      {/* Always render Profile View */}
      <div className="flex-1 px-8 py-8 space-y-8 pb-32 max-w-4xl mx-auto w-full">
        {/* Profile Header */}
        <section className="bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 relative">
            <div className="absolute top-4 right-4">
              <button
                onClick={() => {
                  if (isEditing) {
                    handleUpdateProfile();
                  } else {
                    setIsEditing(true);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white/90 text-slate-700 text-sm sans border border-white/50 hover:bg-white hover:border-slate-300 transition-all duration-200"
              >
                <Edit2 className="w-4 h-4" />
                {isEditing ? 'Save' : 'Edit Profile'}
              </button>
            </div>
          </div>
          
          <div className="px-8 py-1 relative">
            <div className="flex items-start gap-6 -mt-16">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-slate-200 border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                  {profileData.avatarUrl ? (
                    <img
                      src={profileData.avatarUrl || ''}
                      alt={profileData.fullName || 'Profile picture'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-slate-600 text-2xl font-semibold">
                      {profileData.fullName?.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                  )}
                </div>
                {isEditing && (
                  <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors duration-200 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                    <Camera className="w-4 h-4" />
                  </label>
                )}
              </div>
              
              <div className="flex-1 mt-8">
                <div className="flex items-center gap-4 mb-2">
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.fullName || ''}
                      onChange={(e) => handleProfileUpdate('fullName', e.target.value)}
                      className="text-2xl font-semibold text-slate-900 border border-slate-300 px-3 py-1 bg-white focus:border-slate-500 focus:outline-none"
                    />
                  ) : (
                    <h1 className="text-2xl font-semibold text-slate-900">{profileData.fullName}</h1>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-slate-600 mb-4">
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.researchProject || ''}
                      onChange={(e) => handleProfileUpdate('researchProject', e.target.value)}
                      className="text-lg border border-slate-300 px-3 py-1 bg-white focus:border-slate-500 focus:outline-none"
                    />
                  ) : (
                    <span className="text-lg">{profileData.researchProject}</span>
                  )}
                  <span className="text-slate-400">•</span>
                  <div className="flex items-center gap-2">
                    <Beaker className="w-4 h-4" />
                    {isEditing ? (
                      <input
                        type="text"
                        value={profileData.labAffiliation || ''}
                        onChange={(e) => handleProfileUpdate('labAffiliation', e.target.value)}
                        className="border border-slate-300 px-3 py-1 bg-white focus:border-slate-500 focus:outline-none"
                      />
                    ) : (
                      <span>{profileData.labAffiliation}</span>
                    )}
                  </div>
                  <span className="text-slate-400">•</span>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {isEditing ? (
                      <input
                        type="text"
                        value={profileData.location || ''}
                        onChange={(e) => handleProfileUpdate('location', e.target.value)}
                        className="border border-slate-300 px-3 py-1 bg-white focus:border-slate-500 focus:outline-none"
                      />
                    ) : (
                      <span>{profileData.location}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-8 text-sm sans">
                  <div className="text-center">
                    <div className="font-semibold text-slate-900">{profileData.publications || 0}</div>
                    <div className="text-slate-600">Publications</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-slate-900">{profileData.citations || 0}</div>
                    <div className="text-slate-600">Citations</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-slate-900">{profileData.collaborations || 0}</div>
                    <div className="text-slate-600">Collaborations</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-slate-900">{profileData.hot ? "Hot" : "Not Hot"}</div>
                    <div className="text-slate-600">Status</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Research Focus */}
        <section className="bg-white border border-slate-200 shadow-sm">
          <div className="px-8 py-6 border-b border-slate-100">
            <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
              <Target className="w-5 h-5 text-emerald-600" />
              Current Research Focus
            </h2>
          </div>
          <div className="p-8">
            <div className="space-y-6">
              <div>
                <label className="text-sm sans uppercase tracking-widest text-slate-500 mb-3 block">Research Project</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.researchProject || ''}
                    onChange={(e) => handleProfileUpdate('researchProject', e.target.value)}
                    className="w-full text-lg font-semibold text-slate-900 border border-slate-300 px-4 py-3 bg-white focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-200"
                  />
                ) : (
                  <h3 className="text-lg font-semibold text-slate-900">{profileData.researchProject}</h3>
                )}
              </div>
              
              <div>
                <label className="text-sm sans uppercase tracking-widest text-slate-500 mb-3 block">Key Research Question</label>
                {isEditing ? (
                  <textarea
                    value={profileData.keyQuestion || ''}
                    onChange={(e) => handleProfileUpdate('keyQuestion', e.target.value)}
                    rows={3}
                    className="w-full text-slate-700 leading-relaxed border border-slate-300 px-4 py-3 bg-white focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-200 resize-none"
                  />
                ) : (
                  <p className="text-slate-700 leading-relaxed bg-emerald-25 border border-emerald-200 p-4 italic">
                    "{profileData.keyQuestion}"
                  </p>
                )}
              </div>
              
              <div>
                <label className="text-sm sans uppercase tracking-widest text-slate-500 mb-3 block">Research Areas</label>
                <div className="flex flex-wrap gap-3">
                  {profileData.tags.map((tag: string, i: number) => (
                    <span
                      key={i}
                      className="px-4 py-2 text-sm sans bg-slate-100 text-slate-700 border border-slate-300"
                    >
                      {tag}
                      {isEditing && (
                        <button
                          type="button"
                          className="ml-2 text-slate-500 hover:text-slate-700 focus:outline-none"
                          onClick={() => handleRemoveTag(tag)}
                          aria-label={`Remove ${tag}`}
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                  {isEditing && profileData.tags.length < 5 && (
                    <select
                      onChange={(e) => handleAddTag(e.target.value)}
                      value=""
                      className="px-4 py-2 text-sm sans border border-dashed border-slate-400 text-slate-500 hover:border-slate-500 hover:text-slate-600 transition-all duration-200"
                    >
                      <option value="" disabled>+ Add Tag</option>
                      {allTags.filter(tag => !profileData.tags.includes(tag)).map(tag => (
                        <option key={tag} value={tag}>{tag}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="bg-white border border-slate-200 shadow-sm">
          <div className="px-8 py-2 border-b border-slate-100">
            <h2 className="text-xl font-semibold text-slate-900">About</h2>
          </div>
          <div className="px-8 pt-2 pb-8">
            {isEditing ? (
              <textarea
                value={profileData.about || ''}
                onChange={(e) => handleProfileUpdate('about', e.target.value)}
                rows={4}
                className="w-full text-slate-700 leading-relaxed border border-slate-300 px-4 py-3 bg-white focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-200 resize-none"
              />
            ) : (
              <p className="text-slate-700 leading-relaxed">{profileData.about}</p>
            )}
          </div>
        </section>

        {/* Contact Information */}
        <section className="bg-white border border-slate-200 shadow-sm">
          <div className="px-8 py-6 border-b border-slate-100">
            <h2 className="text-xl font-semibold text-slate-900">Contact & Collaboration</h2>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm sans uppercase tracking-widest text-slate-500 mb-2 block">Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={profileData.email || ''}
                    onChange={(e) => handleProfileUpdate('email', e.target.value)}
                    className="w-full text-slate-700 border border-slate-300 px-4 py-2 bg-white focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-200"
                  />
                ) : (
                  <p className="text-slate-700">{profileData.email}</p>
                )}
              </div>
              <div>
                <label className="text-sm sans uppercase tracking-widest text-slate-500 mb-2 block">Organization</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.organization || ''}
                    onChange={(e) => handleProfileUpdate('organization', e.target.value)}
                    className="w-full text-slate-700 border border-slate-300 px-4 py-2 bg-white focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-200"
                  />
                ) : (
                  <p className="text-slate-700">{profileData.organization}</p>
                )}
              </div>
              <div>
                <label className="text-sm sans uppercase tracking-widest text-slate-500 mb-2 block">Lab Affiliation</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.labAffiliation || ''}
                    onChange={(e) => handleProfileUpdate('labAffiliation', e.target.value)}
                    className="w-full text-slate-700 border border-slate-300 px-4 py-2 bg-white focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-200"
                  />
                ) : (
                  <p className="text-slate-700">{profileData.labAffiliation}</p>
                )}
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="flex gap-4">
                <button className="px-6 py-3 border border-slate-300 text-slate-700 text-sm sans uppercase tracking-wider hover:border-slate-400 hover:bg-slate-50 transition-all duration-200">
                  View Publications
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* My Projects Section */}
        <section className="bg-white border border-slate-200 shadow-sm">
          <div className="px-8 py-6 border-b border-slate-100">
            <h2 className="text-xl font-semibold text-slate-900">My Projects</h2>
          </div>
          <div className="p-8">
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
              <p className="text-slate-600 italic">You haven't created any projects yet.</p>
            )}
          </div>
        </section>

      </div>

      <nav className="fixed bottom-0 w-full bg-white border-t border-black flex justify-around py-3 shadow-lg">
        <Link
          href="/feed"
          className={`flex flex-col items-center transition-colors duration-200 ${pathname === "/feed" ? "text-blue-600" : "text-black hover:text-gray-600"}`}
        >
          <Home className="w-5 h-5" />
          <span className="text-sm mt-1">Feed</span>
        </Link>
        <Link
          href="/"
          className={`flex flex-col items-center transition-colors duration-200 ${pathname === "/" ? "text-blue-600" : "text-black hover:text-gray-600"}`}
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
          className={`flex flex-col items-center transition-colors duration-200 ${pathname === "/profile" ? "text-blue-600" : "text-black hover:text-gray-600"}`}
        >
          <User className="w-5 h-5" />
          <span className="text-sm mt-1">Profile</span>
        </Link>
      </nav>
    </div>
  );
} 