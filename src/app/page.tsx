"use client";

// Import necessary dependencies for the home page
import { useEffect, useState } from "react";
import { Home as HomeIcon, Search, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from '@/lib/supabase';
import { getTagColor, getTagHoverColor, initializeTagColors } from "@/lib/tags";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from "next/navigation";

// Mock data for research labs - contains information about various research laboratories
// Each lab object includes name, category, summary, tags, location, and featured status

async function getProjects(tagFilter: string, locationFilter: string, searchTerm: string) {
  try {
    let query = createClient()
      .from('Project')
      .select(`
        *,
        creator:Profile(id, fullName, avatarUrl),
        projectTags ( 
          tagId,
          Tags ( 
            name
          )
        )
      `)
      .order('createdAt', { ascending: false });

    if (tagFilter) {
      // Step 1: Get the tagId for the given tagFilter name
      const { data: tagNameData, error: tagNameError } = await createClient()
        .from('Tags')
        .select('id')
        .eq('name', tagFilter)
        .single();

      if (tagNameError || !tagNameData) {
        console.error('Error fetching tag ID:', tagNameError);
        return [];
      }
      const tagId = tagNameData.id;

      // Step 2: Get projectIds from projectTags that have the fetched tagId
      const { data: projectTagLinks, error: projectTagLinksError } = await createClient()
        .from('projectTags')
        .select('projectId')
        .eq('tagId', tagId);

      if (projectTagLinksError) {
        console.error('Error fetching project tag links:', projectTagLinksError);
        return [];
      }

      const projectIds = projectTagLinks.map((link: { projectId: string }) => link.projectId);
      query = query.in('id', projectIds);
    }

    if (locationFilter) {
      query = query.eq('location', locationFilter);
    }

    if (searchTerm) {
      query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching projects:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getProjects:', error);
    return [];
  }
}

// Main Home component - serves as the landing page of the application
// Displays research labs, trends, and user updates in a modern dashboard layout
export default function Home() {
  // State management for filters and search functionality
  const [loading, setLoading] = useState(true)
  const [labs, setLabs] = useState<any[]>([]);
  const [filter, setFilter] = useState(""); // Filter by tag
  const [locationFilter, setLocationFilter] = useState(""); // Filter by lab location
  const [search, setSearch] = useState("");
  const [filteredLabs, setFilteredLabs] = useState<any[]>([]);
  const [showAllTags, setShowAllTags] = useState(false); // New state for showing all tags
  const [showAllLocations, setShowAllLocations] = useState(false); // New state for showing all locations
  const [dailySignalBoosts, setDailySignalBoosts] = useState(3);
  const [boostedItems, setBoostedItems] = useState(new Set<number>());
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const pathname = usePathname();
  const supabase = createClient();
  const router = useRouter();
  
  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        // Fetch the user's profile data
        const { data: profile, error } = await supabase
          .from('Profile')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (!error && profile) {
          setUserProfile(profile);
        }
      }
    }
    checkUser();
  }, [supabase.auth]);

  useEffect(() => {
    async function fetchInitialData() {
      const projects = await getProjects("", "", ""); // Fetch all projects initially with empty filters
      setLabs(projects);
      setFilteredLabs(projects);
      // Initialize tag colors with all unique tags from the projects
      const allUniqueTags = projects.flatMap((lab: any) => (lab.projectTags || []).map((pt: any) => pt.Tags?.name).filter(Boolean));
      initializeTagColors(allUniqueTags);
      setLoading(false);
    }
    fetchInitialData();
  }, []);

  useEffect(() => {
    async function loadProjects() {
      const projects = await getProjects(filter, locationFilter, search);
      setFilteredLabs(projects);
    }
    if (!loading) {
      loadProjects();
    } 
  }, [filter, locationFilter, search, loading]);


  const allTags = Array.from(new Set(labs.flatMap((lab: any) => 
    (lab.projectTags || []).map((projectTag: any) => projectTag.Tags?.name).filter(Boolean)
  )));
  const allLocations = Array.from(new Set(labs.map((lab: any) => lab.location)));

  const handleSignalBoost = (index: number) => {
    if (dailySignalBoosts > 0 && !boostedItems.has(index)) {
      setDailySignalBoosts(prev => prev - 1);
      setBoostedItems(prev => new Set([...prev, index]));
      setLabs(prev => prev.map((lab, i) => 
        i === index 
          ? { ...lab, signalBoosts: (lab.signalBoosts || 0) + 1, boosted: true }
          : lab
      ));
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans text-gray-900">
      <header className="flex items-center justify-between px-4 py-3 border-b border-black bg-white uppercase tracking-wide">
        <div className="flex items-center gap-3">
          <h1 className="text-md font-bold">Genesis</h1>
          <span className="text-xs text-gray-600 font-medium tracking-wider">Where Breakthroughs Begin</span>
        </div>
        <div className="flex-1 max-w-md mx-8">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search labs, research, discoveries..."
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
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Welcome, {userProfile?.fullName || 'User'}</span>
              <Link
                href="/profile"
                className="text-sm font-medium hover:text-gray-600 transition-colors duration-200"
              >
                Profile
              </Link>
            </div>
          ) : (
            <Link
              href="/signup"
              className="text-sm font-medium hover:text-gray-600 transition-colors duration-200"
            >
              Sign Up
            </Link>
          )}
        </div>
      </header>

      {/* Always render Explore View */}
      <>
        <div className="overflow-x-auto px-6 py-4 border-b border-black">
          <div className="flex gap-4 pb-2">
            {/* Temporarily remove featuredLabs display as 'featured' column does not exist */}
            {/*
            {featuredLabs.map((lab, i) => (
              <div
                key={i}
                className="inline-block min-w-[280px] max-w-[320px] border border-gray-200 bg-gray-50 p-4 hover:border-yellow-300 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold uppercase">Featured</div>
                    <h3 className="text-sm font-bold break-words">{lab.name}</h3>
                  </div>
                </div>
                <Image
                  src={`/images/${localUniversityImages[i % localUniversityImages.length]}`}
                  alt={`Image for ${lab.name}`}
                  width={280}
                  height={150}
                  className="w-full h-auto rounded-md mb-2"
                />
                <p className="text-xs text-gray-800 line-clamp-2">{lab.description}</p>
                {lab.location && (
                  <p className="text-xs text-gray-600 mt-1">Location: {lab.location}</p>
                )}
              </div>
            ))}
            */}
          </div>
        </div>

        <div className="px-6 py-4 border-b border-black space-y-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wide text-gray-600 mr-4">Subject:</span>
            <div className="inline-flex flex-wrap gap-2 max-w-4xl overflow-hidden">
              <button
                onClick={() => setFilter("")}
                className={`text-xs px-3 py-1 border transition-colors duration-200 ${
                  filter === "" ? "bg-black text-white" : "bg-white text-black hover:bg-gray-100"
                }`}
              >
                All
              </button>
              {(showAllTags ? allTags : allTags.slice(0, 8)).map((tag: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setFilter(tag)}
                  className={`text-xs px-3 py-1 border transition-colors duration-200 ${
                    filter === tag ? "bg-black text-white" : "bg-white text-black hover:bg-gray-100"
                  }`}
                >
                  {tag}
                </button>
              ))}
              {allTags.length > 8 && !showAllTags && (
                <button 
                  onClick={() => setShowAllTags(true)}
                  className="text-xs px-3 py-1 border bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors duration-200">
                  +{allTags.length - 8} more
                </button>
              )}
              {showAllTags && (
                <button 
                  onClick={() => setShowAllTags(false)}
                  className="text-xs px-3 py-1 border bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors duration-200">
                  Show Less
                </button>
              )}
            </div>
          </div>
          
          <div>
            <span className="text-xs font-bold uppercase tracking-wide text-gray-600 mr-4">Location:</span>
            <div className="inline-flex flex-wrap gap-2 max-w-4xl overflow-hidden">
              <button
                onClick={() => setLocationFilter("")}
                className={`text-xs px-3 py-1 border transition-colors duration-200 ${
                  locationFilter === "" ? "bg-black text-white" : "bg-white text-black hover:bg-gray-100"
                }`}
              >
                All States
              </button>
              {(showAllLocations ? allLocations : allLocations.slice(0, 8)).map((location: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setLocationFilter(location)}
                  className={`text-xs px-3 py-1 border transition-colors duration-200 ${
                    locationFilter === location ? "bg-black text-white" : "bg-white text-black hover:bg-gray-100"
                  }`}
                >
                  {location}
                </button>
              ))}
              {allLocations.length > 8 && !showAllLocations && (
                <button 
                  onClick={() => setShowAllLocations(true)}
                  className="text-xs px-3 py-1 border bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors duration-200">
                  +{allLocations.length - 8} more
                </button>
              )}
              {showAllLocations && (
                <button 
                  onClick={() => setShowAllLocations(false)}
                  className="text-xs px-3 py-1 border bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors duration-200">
                  Show Less
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Scientists Photo Banner */}
        <div className="px-6 py-6 border-b border-black">
          <div className="relative overflow-hidden rounded-lg border border-gray-200">
            <Image
              src="https://images.pexels.com/photos/2280549/pexels-photo-2280549.jpeg?auto=compress&cs=tinysrgb&w=2000&h=600&fit=crop"
              alt="Scientists and researchers collaborating in laboratory"
              width={2000}
              height={600}
              className="w-full h-48 object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
            <div className="absolute bottom-4 left-4 text-white">
              <h3 className="text-xl font-bold mb-1">Where Science Meets Innovation</h3>
              <p className="text-sm opacity-90">Connect • Discover • Collaborate</p>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-32">
          {filteredLabs.map((lab, i) => (
            <div
              key={i}
              className="border border-gray-200 bg-white rounded-lg overflow-hidden cursor-pointer transform transition-all duration-300 ease-out hover:border-yellow-400 hover:shadow-2xl hover:shadow-yellow-200/50 hover:scale-[1.03] group"
              style={{
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 20px 40px rgba(251, 191, 36, 0.3), 0 0 0 1px rgba(251, 191, 36, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1)";
              }}
              onClick={() => router.push(`/project/${lab.id}`)}
            >
              {/* Project Photo */}
              <div className="w-full h-48 relative overflow-hidden">
                {lab.photo ? (
                  <Image
                    src={lab.photo}
                    alt={lab.name}
                    width={400}
                    height={300}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                    <svg className="w-16 h-16 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute top-4 left-4">
                  <div className="px-2 py-1 bg-white/90 rounded-full text-xs font-medium text-gray-700">
                    {lab.category === 1 ? 'Biology' :
                     lab.category === 2 ? 'Chemistry' :
                     lab.category === 3 ? 'Physics' :
                     lab.category === 4 ? 'Computer Science' :
                     lab.category === 5 ? 'Engineering' : 'Other'}
                  </div>
                </div>
                <svg
                  onClick={() => handleSignalBoost(i)}
                  className={`absolute top-4 right-4 w-6 h-6 cursor-pointer transition-colors duration-300 ${boostedItems.has(i) ? 'text-yellow-400 opacity-80' : 'text-white opacity-60'} group-hover:text-yellow-400 group-hover:opacity-100`}
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12,2L15.09,8.26L22,9L17,14L18.18,21L12,17.77L5.82,21L7,14L2,9L8.91,8.26L12,2Z"/>
                </svg>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-bold mb-2 group-hover:text-gray-900 transition-colors duration-200">{lab.name}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2 group-hover:text-gray-700 transition-colors duration-200">{lab.description}</p>
                {lab.location && (
                  <div className="flex items-center text-sm text-gray-600 mb-3 group-hover:text-gray-700 transition-colors duration-200">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {lab.location}
                  </div>
                )}
                <div className="flex flex-wrap gap-2 mb-4">
                  {(lab.projectTags || []).map((pt: any, j: number) => (
                    pt.Tags?.name && (
                      <span
                        key={j}
                        className={`text-xs border px-2 py-0.5 rounded-full transition-all duration-200 ${getTagColor(pt.Tags.name)} group-hover:${getTagHoverColor(pt.Tags.name)}`}
                      >
                        {pt.Tags.name}
                      </span>
                    )
                  ))}
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 px-3 py-2 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-all duration-200 transform hover:scale-105 active:scale-95">
                    View Project
                  </button>
                  {user && user.id !== lab.creator?.id && (
                    <Link href={`/chat/${lab.creator?.id}`}>
                      <button className="px-3 py-2 text-sm bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-all duration-200 transform hover:scale-105 active:scale-95">
                        Collaborate
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </>

      <nav className="fixed bottom-0 w-full bg-white border-t border-black flex justify-around py-3 shadow-lg">
        <Link
          href="/feed"
          className={`flex flex-col items-center transition-colors duration-200 ${pathname === "/feed" ? "text-blue-600" : "text-black hover:text-gray-600"}`}
        >
          <HomeIcon className="w-5 h-5" />
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