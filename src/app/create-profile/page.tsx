'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateProfile() {
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [researchProject, setResearchProject] = useState<string | null>(null);
  const [keyQuestion, setkeyQuestion] = useState<string | null>(null);
  const [bio, setBio] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [location, setLocation] = useState<string | null>(null);
  const [organization, setOrganization] = useState<string | null>(null);
  const [labAffiliation, setLabAffiliation] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    async function getSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      // Check if profile already exists for this user
      const { data, error } = await supabase
        .from('Profile')
        .select('id') // Only need to check for existence
        .eq('id', session.user.id)
        .single();

      if (data) {
        // If profile exists, redirect to profile page
        router.push('/profile');
      } else if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error('Error checking profile:', error);
        setError(error.message);
      }
      setLoading(false);
    }
    async function fetchTags() {
      const { data, error } = await supabase.from('Tags').select('name');
      if (!error && data) {
        setAllTags(data.map((t: { name: string }) => t.name).filter(Boolean));
      }
    }
    getSession();
    fetchTags();
  }, [router, supabase]);

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError('User not authenticated.');
      setLoading(false);
      return;
    }

    try {
      // First, create the profile
      const profileUpdates = {
        id: user.id,
        fullName: fullName,
        avatarUrl: avatarUrl,
        researchProject,
        keyQuestion,
        about: bio,
        location,
        organization,
        labAffiliation,
        email,
        createdAt: new Date().toISOString(),
      };

      const { error: profileError } = await supabase
        .from('Profile')
        .upsert(profileUpdates, { onConflict: 'id' });

      if (profileError) {
        console.error('Profile upsert error:', profileError);
        throw profileError;
      }

      // Then, handle the tags
      console.log('Selected tags for saving:', tags);
      if (tags.length > 0) {
        // First, get the tag IDs for the selected tags
        const { data: tagData, error: tagError } = await supabase
          .from('Tags')
          .select('id, name')
          .in('name', tags);

        if (tagError) {
          console.error('Error fetching tag IDs:', tagError);
          throw tagError;
        }

        if (!tagData || tagData.length === 0) {
          console.warn('No tag IDs found for selected tags:', tags);
        }

        // Create entries in the profileTags junction table
        const profileTagInserts = tagData.map(tag => ({
          profileId: user.id,
          tagId: tag.id
        }));
        console.log('Profile tag inserts:', profileTagInserts);

        const { error: profileTagsError } = await supabase
          .from('profileTags')
          .upsert(profileTagInserts, { onConflict: 'profileId,tagId' });

        if (profileTagsError) {
          console.error('Error inserting profile tags:', profileTagsError);
          throw profileTagsError;
        }
      }

      router.push('/'); // Redirect to home page after successful creation
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-lg font-semibold">Loading...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans text-gray-900">
      <header className="flex items-center justify-between px-4 py-3 border-b border-black bg-white uppercase tracking-wide">
        <div className="flex items-center gap-3">
          <h1 className="text-md font-bold">Genesis</h1>
          <span className="text-xs text-gray-600 font-medium tracking-wider">Where Breakthroughs Begin</span>
        </div>
        <div className="flex-1 max-w-md mx-8">
          {/* Search Bar - can be removed or made functional if needed */}
          <input
            type="text"
            placeholder="Search..."
            className="w-full text-sm border-2 border-gray-300 bg-white px-4 py-2 rounded-lg font-sans focus:border-blue-500 focus:outline-none transition-colors duration-200 shadow-sm"
          />
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/about"
            className="text-sm font-medium hover:text-gray-600 transition-colors duration-200"
          >
            About
          </Link>
          {/* Optional: Add a sign-out button here if user is logged in */}
        </div>
      </header>

      <main className="flex-1 p-6 flex justify-center items-center">
        <div className="w-full max-w-5xl bg-white rounded-xl shadow-2xl overflow-hidden animate-fade-in-up p-8">
          <form onSubmit={handleCreateProfile} className="space-y-8">
            <h2 className="text-3xl font-extrabold text-gray-900 text-center tracking-tight mb-8">Create Your Profile</h2>
            {error && (
              <p className="text-red-600 text-sm text-center font-medium bg-red-50 p-3 rounded-md border border-red-200">
                {error}
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
              {/* Left Column - Profile Card */}
              <div className="md:col-span-2 space-y-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Profile Information</h3>
                
                {/* Full Name */}
                <div>
                  <label
                    className="block text-sm font-semibold text-gray-700 mb-2"
                    htmlFor="fullName"
                  >
                    Full Name
                  </label>
                  <input
                    className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ease-in-out text-base"
                    id="fullName"
                    type="text"
                    placeholder="Your full name"
                    value={fullName || ''}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                {/* Avatar URL */}
                <div>
                  <label
                    className="block text-sm font-semibold text-gray-700 mb-2"
                    htmlFor="avatarUrl"
                  >
                    Avatar URL (Optional)
                  </label>
                  <input
                    className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ease-in-out text-base"
                    id="avatarUrl"
                    type="text"
                    placeholder="https://example.com/your-avatar.jpg"
                    value={avatarUrl || ''}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                  />
                </div>

                {/* Organization */}
                <div>
                  <label
                    className="block text-sm font-semibold text-gray-700 mb-2"
                    htmlFor="organization"
                  >
                    Organization
                  </label>
                  <input
                    className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ease-in-out text-base"
                    id="organization"
                    type="text"
                    placeholder="e.g., Stanford University"
                    value={organization || ''}
                    onChange={(e) => setOrganization(e.target.value)}
                  />
                </div>

                {/* Lab Affiliation */}
                <div>
                  <label
                    className="block text-sm font-semibold text-gray-700 mb-2"
                    htmlFor="labAffiliation"
                  >
                    Lab Affiliation
                  </label>
                  <input
                    className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ease-in-out text-base"
                    id="labAffiliation"
                    type="text"
                    placeholder="e.g., AI Research Lab"
                    value={labAffiliation || ''}
                    onChange={(e) => setLabAffiliation(e.target.value)}
                  />
                </div>

                {/* Location */}
                <div>
                  <label
                    className="block text-sm font-semibold text-gray-700 mb-2"
                    htmlFor="location"
                  >
                    Location
                  </label>
                  <input
                    className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ease-in-out text-base"
                    id="location"
                    type="text"
                    placeholder="e.g., San Francisco, CA"
                    value={location || ''}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>

                {/* Email */}
                <div>
                  <label
                    className="block text-sm font-semibold text-gray-700 mb-2"
                    htmlFor="email"
                  >
                    Email
                  </label>
                  <input
                    className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ease-in-out text-base"
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email || ''}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Right Column - Research Information */}
              <div className="md:col-span-3 space-y-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Research Information</h3>

                {/* Research Project */}
                <div>
                  <label
                    className="block text-sm font-semibold text-gray-700 mb-2"
                    htmlFor="researchProject"
                  >
                    Current Research Project
                  </label>
                  <input
                    className="block w-full max-w-2xl px-4 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ease-in-out text-base"
                    id="researchProject"
                    type="text"
                    placeholder="e.g., AI in Drug Discovery"
                    value={researchProject || ''}
                    onChange={(e) => setResearchProject(e.target.value)}
                  />
                </div>

                {/* Research Question */}
                <div>
                  <label
                    className="block text-sm font-semibold text-gray-700 mb-2"
                    htmlFor="keyQuestion"
                  >
                    Primary Research Question
                  </label>
                  <textarea
                    className="block w-full max-w-2xl px-4 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ease-in-out text-base"
                    id="keyQuestion"
                    placeholder="e.g., How can machine learning optimize protein folding?"
                    value={keyQuestion || ''}
                    onChange={(e) => setkeyQuestion(e.target.value)}
                    rows={3}
                  ></textarea>
                </div>

                {/* Bio */}
                <div>
                  <label
                    className="block text-sm font-semibold text-gray-700 mb-2"
                    htmlFor="bio"
                  >
                    Bio
                  </label>
                  <textarea
                    className="block w-full max-w-2xl px-4 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ease-in-out text-base"
                    id="bio"
                    placeholder="Tell us about yourself and your expertise..."
                    value={bio || ''}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                  ></textarea>
                </div>

                {/* Research Focus */}
                <div>
                  <label
                    className="block text-sm font-semibold text-gray-700 mb-2"
                    htmlFor="tags"
                  >
                    Research Focus (pick up to 5)
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2 max-w-2xl">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium border border-blue-200 mr-2 mb-2"
                      >
                        {tag}
                        <button
                          type="button"
                          className="ml-2 text-blue-500 hover:text-blue-700 focus:outline-none"
                          onClick={() => setTags(tags.filter((t) => t !== tag))}
                          aria-label={`Remove ${tag}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 max-w-2xl">
                    {allTags.filter((tag) => !tags.includes(tag)).map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className={`px-3 py-1 rounded-full border text-xs font-medium transition-colors duration-200 ${tags.length >= 5 ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-100 hover:text-blue-900'}`}
                        onClick={() => {
                          if (tags.length < 5) setTags([...tags, tag]);
                        }}
                        disabled={tags.length >= 5}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <button
                className="w-full max-w-2xl mx-auto block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-300 ease-in-out transform hover:-translate-y-0.5"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Creating Profile...' : 'Create Profile'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
} 