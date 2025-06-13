'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { Home, Search, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function CreateProject() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [projectData, setProjectData] = useState({
    name: '',
    description: '',
    category: '',
    location: '',
    visibility: 'public',
    tags: [] as string[],
    photo: null as string | null
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);
  const supabase = createClientComponentClient();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function fetchTags() {
      try {
        const { data: tags, error: tagsError } = await supabase
          .from('Tags')
          .select('name')
          .order('name');

        if (tagsError) {
          console.error('Error fetching tags:', tagsError);
          return;
        }

        if (tags) {
          setAllTags(tags.map(tag => tag.name).filter(Boolean));
        }
      } catch (error) {
        console.error('Error in fetchTags:', error);
      }
    }

    fetchTags();
  }, [supabase]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      // Create a temporary URL for preview
      const previewUrl = URL.createObjectURL(file);
      setProjectData(prev => ({
        ...prev,
        photo: previewUrl
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('You must be logged in to create a project');
      }

      let photoUrl = null;

      // Upload photo if one was selected
      if (selectedFile) {
        setUploading(true);
        const fileExt = selectedFile.name.split('.').pop();
        const filePath = `${Date.now()}-${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('projectphotos')
          .upload(filePath, selectedFile);

        if (uploadError) {
          throw new Error(`Photo upload failed: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('projectphotos')
          .getPublicUrl(filePath);

        photoUrl = publicUrl;
        setUploading(false);
      }

      // Create the project
      const { data: project, error: projectError } = await supabase
        .from('Project')
        .insert({
          name: projectData.name,
          description: projectData.description,
          category: projectData.category,
          location: projectData.location,
          visibility: projectData.visibility,
          photo: photoUrl,
          createdBy: user.id,
          createdAt: new Date().toISOString()
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Handle tags if any are selected
      if (projectData.tags.length > 0) {
        const { data: tagData, error: tagError } = await supabase
          .from('Tags')
          .select('id, name')
          .in('name', projectData.tags);

        if (tagError) throw tagError;

        const projectTagInserts = tagData.map(tag => ({
          projectId: project.id,
          tagId: tag.id
        }));

        const { error: projectTagsError } = await supabase
          .from('projectTags')
          .insert(projectTagInserts);

        if (projectTagsError) throw projectTagsError;
      }

      router.push(`/project/${project.id}`);
    } catch (error: any) {
      console.error('Error creating project:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = (tag: string) => {
    if (projectData.tags.length < 5 && !projectData.tags.includes(tag)) {
      setProjectData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setProjectData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  return (
    <div className="flex flex-col min-h-screen bg-stone-50 font-serif text-slate-900">
      <header className="flex items-center justify-between px-8 py-6 border-b-2 border-slate-200 bg-white">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Genesis</h1>
          <span className="text-sm text-slate-600 font-light italic tracking-wide">Where Science Convenes</span>
        </div>
      </header>

      <main className="flex-1 px-8 py-8 pb-32">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900 mb-8">Create New Project</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                Project Name
              </label>
              <input
                type="text"
                id="name"
                value={projectData.name}
                onChange={(e) => setProjectData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={projectData.description}
                onChange={(e) => setProjectData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Project Photo
              </label>
              <div className="flex items-center gap-4">
                {projectData.photo ? (
                  <div className="relative w-32 h-32">
                    <img
                      src={projectData.photo}
                      alt="Project preview"
                      className="w-full h-full object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setProjectData(prev => ({ ...prev, photo: null }));
                      }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-slate-300 rounded-md cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-colors duration-200">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="mt-2 text-sm text-slate-600">Add Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={loading}
                    />
                  </label>
                )}
                {uploading && (
                  <span className="text-sm text-slate-600">Uploading...</span>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-2">
                Category
              </label>
              <select
                id="category"
                value={projectData.category}
                onChange={(e) => setProjectData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              >
                <option value="">Select a category</option>
                <option value="1">Biology</option>
                <option value="2">Chemistry</option>
                <option value="3">Physics</option>
                <option value="4">Computer Science</option>
                <option value="5">Engineering</option>
              </select>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-slate-700 mb-2">
                Location
              </label>
              <input
                type="text"
                id="location"
                value={projectData.location}
                onChange={(e) => setProjectData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="e.g., Stanford University"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Research Areas (up to 5)
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {projectData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-emerald-600 text-white rounded-full text-sm flex items-center gap-2"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-white hover:text-emerald-100"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              {projectData.tags.length < 5 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2">
                  {allTags
                    .filter(tag => !projectData.tags.includes(tag))
                    .map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleAddTag(tag)}
                        className="px-3 py-2 text-sm border border-slate-300 rounded-md hover:border-emerald-500 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 transition-colors duration-200 text-left"
                      >
                        {tag}
                      </button>
                    ))}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="visibility" className="block text-sm font-medium text-slate-700 mb-2">
                Visibility
              </label>
              <select
                id="visibility"
                value={projectData.visibility}
                onChange={(e) => setProjectData(prev => ({ ...prev, visibility: e.target.value }))}
                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {loading ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      </main>

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
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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