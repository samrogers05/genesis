'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, User, MessageSquare, Search, Edit2 } from 'lucide-react';
import Image from 'next/image';

interface Change {
  id: string;
  createdAt: string;
  description: string;
  image: string | null;
  projectId: string;
}

interface SupabasePublication {
  id: string;
  createdAt: string;
  title: string;
  journal: string | null;
  year: number | null;
  abstract: string | null;
  paper: string | null;
  profileId: string;
  projectId: string;
  profile: Array<{
    id: string;
    fullName: string | null;
    avatarUrl: string | null;
    email: string | null;
  }>;
}

interface Publication {
  id: string;
  createdAt: string;
  title: string;
  journal: string | null;
  year: number | null;
  abstract: string | null;
  paper: string | null;
  profileId: string;
  projectId: string;
  profile: {
    id: string;
    fullName: string | null;
    avatarUrl: string | null;
    email: string | null;
  } | null;
}

export default function ProjectPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const { user } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState<any>(null);
  const [inviteeEmail, setInviteeEmail] = useState<string>('');
  const [invitationMessage, setInvitationMessage] = useState<string | null>(null);
  const [changes, setChanges] = useState<Change[]>([]);
  const [newChangeDescription, setNewChangeDescription] = useState<string>('');
  const [newChangeImage, setNewChangeImage] = useState<string>('');
  const [pendingInvitations, setPendingInvitations] = useState(0);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [newPublicationTitle, setNewPublicationTitle] = useState<string>('');
  const [newPublicationJournal, setNewPublicationJournal] = useState<string>('');
  const [newPublicationYear, setNewPublicationYear] = useState<string>('');
  const [newPublicationAbstract, setNewPublicationAbstract] = useState<string>('');
  const [newPublicationFile, setNewPublicationFile] = useState<File | null>(null);
  const [uploadingPaper, setUploadingPaper] = useState(false);
  const [publicationMessage, setPublicationMessage] = useState<string | null>(null);

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
            createdBy,
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
        const createdBy = data?.createdBy;

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
          createdBy: createdBy,
          Collaborators: data.Collaborators || []
        };

        setProject(transformedData);
        setEditedProject(transformedData);
        setError(null);

        // Fetch changes for the project
        const { data: changesData, error: changesError } = await supabase
          .from('Change')
          .select('id, createdAt, description, image, projectId')
          .eq('projectId', params.id)
          .order('createdAt', { ascending: false });

        if (changesError) throw changesError;

        setChanges(changesData as Change[]);

        // Fetch publications for the project
        const { data: publicationsData, error: publicationsError } = await supabase
          .from('Publications')
          .select(`
            id,
            createdAt,
            title,
            journal,
            year,
            abstract,
            paper,
            profileId,
            projectId,
            profile:Profile!profileId(id, fullName, avatarUrl, email)
          `)
          .eq('projectId', params.id)
          .order('createdAt', { ascending: false });

        if (publicationsError) throw publicationsError;
        setPublications((publicationsData as SupabasePublication[]).map(pub => ({
          id: pub.id,
          createdAt: pub.createdAt,
          title: pub.title,
          journal: pub.journal,
          year: pub.year,
          abstract: pub.abstract,
          paper: pub.paper,
          profileId: pub.profileId,
          projectId: pub.projectId,
          profile: pub.profile && pub.profile.length > 0 ? pub.profile[0] : null,
        })));

        // Load pending invitations count
        if (user) {
          const { count, error: invitationsError } = await supabase
            .from('CollaborationInvitations')
            .select('*', { count: 'exact', head: true })
            .eq('inviteeId', user.id)
            .eq('status', 'pending');

          if (invitationsError) throw invitationsError;

          setPendingInvitations(count || 0);
        } else {
          setPendingInvitations(0);
        }

      } catch (err) {
        console.error('Error loading project or changes:', err);
        setError('Failed to load project or changes');
      } finally {
        setLoading(false);
      }
    }

    loadProject();
  }, [params.id, supabase, user]);

  const handleCollaborate = () => {
    if (!project?.creatorid) return;
    router.push(`/chat/${project.creatorid}`);
  };

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditedProject({
      ...editedProject,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdateProject = async () => {
    if (!user || !editedProject) return;

    try {
      setLoading(true);
      const { error: updateError } = await supabase
        .from('Project')
        .update({
          name: editedProject.name,
          description: editedProject.description,
          photo: editedProject.photo,
        })
        .eq('id', editedProject.id)
        .eq('createdBy', user.id);

      if (updateError) throw updateError;

      setProject(editedProject);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating project:', error);
      setError('Failed to update project.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvitation = async () => {
    if (!user || !project?.id || !inviteeEmail) {
      setInvitationMessage('Please ensure you are logged in, the project is loaded, and an email is provided.');
      return;
    }

    // 1. Find invitee's profile ID by email
    const { data: inviteeProfile, error: inviteeError } = await supabase
      .from('Profile')
      .select('id')
      .eq('email', inviteeEmail)
      .single();

    if (inviteeError || !inviteeProfile) {
      setInvitationMessage('Invitee not found. Please check the email address.');
      console.error('Invitee lookup error:', inviteeError);
      return;
    }

    const inviteeId = inviteeProfile.id;

    // Prevent inviting self
    if (inviteeId === user.id) {
      setInvitationMessage('You cannot invite yourself to collaborate.');
      return;
    }

    // Prevent inviting existing collaborators (optional, but good practice)
    const isExistingCollaborator = project.Collaborators.some((collab: any) => collab.Profile[0]?.id === inviteeId);
    if (isExistingCollaborator) {
      setInvitationMessage('This user is already a collaborator.');
      return;
    }

    // 2. Send invitation
    const { error: invitationInsertError } = await supabase
      .from('CollaborationInvitations')
      .insert({
        projectId: project.id,
        inviterId: user.id,
        inviteeId: inviteeId,
        status: 'pending',
      });

    if (invitationInsertError) {
      if (invitationInsertError.code === '23505') { // 23505 is unique violation code
        setInvitationMessage('Invitation already sent to this user for this project.');
      } else {
        setInvitationMessage('Failed to send invitation.');
        console.error('Invitation insert error:', invitationInsertError);
      }
      return;
    }

    setInvitationMessage('Invitation sent successfully!');
    setInviteeEmail(''); // Clear input field
  };

  const handleAddPublication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !project?.id || !newPublicationTitle || !newPublicationFile) {
      setPublicationMessage('Please fill all required fields (Title, and upload a Paper).');
      return;
    }

    setUploadingPaper(true);
    setPublicationMessage(null);

    let paperPath: string | null = null;
    try {
      const fileExt = newPublicationFile.name.split('.').pop();
      const fileName = `${project.id}/${user.id}/${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('paper')
        .upload(fileName, newPublicationFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;
      paperPath = uploadData.path;

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('paper')
        .getPublicUrl(paperPath);
      
      paperPath = publicUrlData.publicUrl;

      const { error: insertError } = await supabase
        .from('Publications')
        .insert({
          projectId: project.id,
          profileId: user.id,
          title: newPublicationTitle,
          journal: newPublicationJournal || null,
          year: newPublicationYear ? parseInt(newPublicationYear) : null,
          abstract: newPublicationAbstract || null,
          paper: paperPath,
        });

      if (insertError) throw insertError;

      // Refetch publications to update the list
      const { data: updatedPublications, error: fetchPublicationsError } = await supabase
        .from('Publications')
        .select(`
          id,
          createdAt,
          title,
          journal,
          year,
          abstract,
          paper,
          profileId,
          projectId,
          profile:Profile!profileId(id, fullName, avatarUrl, email)
        `)
        .eq('projectId', params.id)
        .order('createdAt', { ascending: false });

      if (fetchPublicationsError) throw fetchPublicationsError;

      setPublications((updatedPublications as SupabasePublication[]).map(pub => ({
        id: pub.id,
        createdAt: pub.createdAt,
        title: pub.title,
        journal: pub.journal,
        year: pub.year,
        abstract: pub.abstract,
        paper: pub.paper,
        profileId: pub.profileId,
        projectId: pub.projectId,
        profile: pub.profile && pub.profile.length > 0 ? pub.profile[0] : null,
      })));
      setNewPublicationTitle('');
      setNewPublicationJournal('');
      setNewPublicationYear('');
      setNewPublicationAbstract('');
      setNewPublicationFile(null);
      setPublicationMessage('Publication added successfully!');
    } catch (error: any) {
      console.error('Error adding publication:', error);
      setPublicationMessage(`Failed to add publication: ${error.message || error.toString()}`);
    } finally {
      setUploadingPaper(false);
    }
  };

  const isProjectCreator = user && project?.createdBy === user.id;
  const isCollaborator = user && project?.Collaborators.some((collab: any) => collab.Profile[0]?.id === user.id);
  const canAddUpdates = isProjectCreator || isCollaborator;

  const handleAddChange = async () => {
    if (!user || !project?.id || (!newChangeDescription && !newChangeImage)) return;

    try {
      setLoading(true);
      const { error: insertError } = await supabase
        .from('Change')
        .insert({
          projectId: project.id,
          description: newChangeDescription,
          image: newChangeImage || null,
        });

      if (insertError) throw insertError;

      // Refetch changes to update the list
      const { data: updatedChanges, error: fetchChangesError } = await supabase
        .from('Change')
        .select('id, createdAt, description, image, projectId')
        .eq('projectId', params.id)
        .order('createdAt', { ascending: false });

      if (fetchChangesError) throw fetchChangesError;

      setChanges(updatedChanges as Change[]);
      setNewChangeDescription('');
      setNewChangeImage('');
    } catch (error) {
      console.error('Error adding change:', error);
      setError('Failed to add change.');
    } finally {
      setLoading(false);
    }
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
          {isEditing ? (
            <input
              type="text"
              name="name"
              value={editedProject.name || ''}
              onChange={handleFieldChange}
              className="text-5xl font-bold mb-4 leading-tight bg-transparent border-b border-white/50 focus:outline-none focus:border-white w-full text-white"
            />
          ) : (
            <h1 className="text-5xl font-bold mb-4 leading-tight">{project.name}</h1>
          )}
          <div className="flex items-center gap-4 text-lg text-slate-200">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              <span>{project.creatorName || 'Anonymous'}</span>
            </div>
            {user && user.id === project.createdBy && (
              <button
                onClick={() => { 
                  if (isEditing) {
                    handleUpdateProject();
                  } else {
                    setIsEditing(true);
                  }
                }}
                className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-white text-sm"
              >
                <Edit2 className="w-4 h-4" />
                {isEditing ? 'Save' : 'Edit Project'}
              </button>
            )}
          </div>
          {isEditing ? (
            <textarea
              name="description"
              value={editedProject.description || ''}
              onChange={handleFieldChange}
              className="text-lg text-slate-200 mt-4 bg-transparent border-b border-white/50 focus:outline-none focus:border-white w-full h-24 text-white"
            />
          ) : (
            <p className="text-lg text-slate-200 mt-4">{project.description}</p>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-8 py-8">
        {/* Collaboration Invitation Section */}
        {user && user.id === project.createdBy && (
          <section className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">Invite Collaborator</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                placeholder="Collaborator Email"
                value={inviteeEmail}
                onChange={(e) => setInviteeEmail(e.target.value)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={handleSendInvitation}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
              >
                Send Invitation
              </button>
            </div>
            {invitationMessage && (
              <p className="mt-4 text-sm font-medium text-center "
                style={{ color: invitationMessage.includes('successfully') ? 'green' : 'red' }}>
                {invitationMessage}
              </p>
            )}
          </section>
        )}

        <section className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">Project Description</h2>
          {isEditing ? (
            <textarea
              name="description"
              value={editedProject.description || ''}
              onChange={handleFieldChange}
              className="w-full h-40 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            ></textarea>
          ) : (
            <p className="text-slate-700 leading-relaxed whitespace-pre-line">{project.description}</p>
          )}
        </section>

        {/* Updates Section */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">Updates</h2>
          {changes.length === 0 ? (
            <p className="text-slate-600">No updates yet.</p>
          ) : (
            <div className="space-y-6">
              {changes.map((change) => (
                <div key={change.id} className="border-b border-slate-200 pb-4 last:border-b-0">
                  <p className="text-sm text-slate-500 mb-2">
                    {new Date(change.createdAt).toLocaleDateString()} at {new Date(change.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-slate-700 leading-relaxed">{change.description}</p>
                  {change.image && (
                    <div className="mt-4 w-full h-64 relative rounded-lg overflow-hidden">
                      <Image
                        src={change.image}
                        alt="Update image"
                        layout="fill"
                        objectFit="cover"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {canAddUpdates && (
            <div className="mt-8 pt-6 border-t border-slate-200">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Add New Update</h3>
              <textarea
                placeholder="What's new with the project?"
                value={newChangeDescription}
                onChange={(e) => setNewChangeDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-4"
              ></textarea>
              <input
                type="text"
                placeholder="Image URL (optional)"
                value={newChangeImage}
                onChange={(e) => setNewChangeImage(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-4"
              />
              <button
                onClick={handleAddChange}
                className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors w-full"
              >
                Add Update
              </button>
            </div>
          )}
        </section>

        {/* Publications Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Publications</h2>
          {publications.length === 0 && (
            <p className="text-slate-600">No publications found for this project yet.</p>
          )}
          <div className="space-y-6">
            {publications.map((pub) => (
              <div key={pub.id} className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{pub.title}</h3>
                <p className="text-slate-600 text-sm mb-1">
                  {pub.journal && <span>{pub.journal}, </span>}
                  {pub.year && <span>{pub.year}</span>}
                </p>
                {pub.abstract && (
                  <p className="text-slate-700 text-sm line-clamp-3 mb-3">{pub.abstract}</p>
                )}
                {pub.paper && (
                  <a
                    href={pub.paper}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-emerald-600 hover:text-emerald-700 transition-colors text-sm font-medium"
                  >
                    View Paper
                    <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
                <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                  <div className="w-6 h-6 rounded-full bg-slate-200">
                    {pub.profile?.avatarUrl && (
                      <Image
                        src={pub.profile.avatarUrl}
                        alt={pub.profile.fullName || 'Author'}
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                    )}
                  </div>
                  <span>{pub.profile?.fullName || 'Anonymous'}</span>
                  <span>&bull;</span>
                  <span>{new Date(pub.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>

          {canAddUpdates && (
            <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Add New Publication</h3>
              <form onSubmit={handleAddPublication} className="space-y-4">
                <div>
                  <label htmlFor="publicationTitle" className="block text-sm font-medium text-slate-700">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="publicationTitle"
                    className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2 focus:ring-emerald-500 focus:border-emerald-500"
                    value={newPublicationTitle}
                    onChange={(e) => setNewPublicationTitle(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="publicationJournal" className="block text-sm font-medium text-slate-700">
                    Journal
                  </label>
                  <input
                    type="text"
                    id="publicationJournal"
                    className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2 focus:ring-emerald-500 focus:border-emerald-500"
                    value={newPublicationJournal}
                    onChange={(e) => setNewPublicationJournal(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="publicationYear" className="block text-sm font-medium text-slate-700">
                    Year
                  </label>
                  <input
                    type="number"
                    id="publicationYear"
                    className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2 focus:ring-emerald-500 focus:border-emerald-500"
                    value={newPublicationYear}
                    onChange={(e) => setNewPublicationYear(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="publicationAbstract" className="block text-sm font-medium text-slate-700">
                    Abstract
                  </label>
                  <textarea
                    id="publicationAbstract"
                    rows={4}
                    className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm p-2 focus:ring-emerald-500 focus:border-emerald-500"
                    value={newPublicationAbstract}
                    onChange={(e) => setNewPublicationAbstract(e.target.value)}
                  ></textarea>
                </div>
                <div>
                  <label htmlFor="publicationPaper" className="block text-sm font-medium text-slate-700">
                    Upload Paper (PDF) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    id="publicationPaper"
                    accept=".pdf"
                    className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                    onChange={(e) => setNewPublicationFile(e.target.files ? e.target.files[0] : null)}
                    required
                  />
                </div>
                {publicationMessage && (
                  <p className={`text-sm ${publicationMessage.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
                    {publicationMessage}
                  </p>
                )}
                <button
                  type="submit"
                  className="w-full bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 transition-colors flex items-center justify-center"
                  disabled={uploadingPaper}
                >
                  {uploadingPaper ? (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    'Add Publication'
                  )}
                </button>
              </form>
            </div>
          )}
        </section>

        {/* Collaborators Section */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">Collaborators</h2>
          {project.Collaborators && project.Collaborators.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {project.Collaborators.map((collab: any) => (
                <Link
                  key={collab.Profile.id}
                  href={`/profile/${collab.Profile.id}`}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                    {collab.Profile.avatarUrl ? (
                      <Image
                        src={collab.Profile.avatarUrl}
                        alt={collab.Profile.fullName}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600 text-base">
                        {collab.Profile.fullName?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>
                  <span className="font-medium text-slate-800 truncate">
                    {collab.Profile.fullName}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-slate-600">No collaborators yet.</p>
          )}
        </section>

        {/* Creator's Public Profile Link */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">Project Creator</h2>
          <Link
            href={`/profile/${project.creatorid}`}
            className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
              {project.creatorUrl ? (
                <Image
                  src={project.creatorUrl}
                  alt={project.creatorName}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600 text-base">
                  {project.creatorName?.charAt(0) || '?'}
                </div>
              )}
            </div>
            <span className="font-medium text-slate-800 truncate">
              {project.creatorName}
            </span>
          </Link>
          {user && user.id !== project.createdBy && (
            <button
              onClick={handleCollaborate}
              className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Chat with Creator
            </button>
          )}
        </section>
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