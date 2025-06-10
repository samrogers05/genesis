"use client";

// Import necessary dependencies for the home page
import { useEffect, useState } from "react";
import { Home as HomeIcon, Search, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getTagColor, getTagHoverColor, initializeTagColors } from "@/lib/tags";

// Mock data for research labs - contains information about various research laboratories
// Each lab object includes name, category, summary, tags, location, and featured status

async function getProjects(tagFilter: string, locationFilter: string, searchTerm: string) {
  try {
    let query = supabase
      .from('Project')
      .select(`
        *,
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
      const { data: tagNameData, error: tagNameError } = await supabase
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
      const { data: projectTagLinks, error: projectTagLinksError } = await supabase
        .from('projectTags')
        .select('projectId')
        .eq('tagId', tagId);

      if (projectTagLinksError) {
        console.error('Error fetching project tag links:', projectTagLinksError);
        return [];
      }

      const projectIds = projectTagLinks.map(link => link.projectId);
      query = query.in('id', projectIds);
    }

    if (locationFilter) {
      query = query.eq('location', locationFilter);
    }

    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
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

// User updates array - contains recent notifications and updates for the user
// Each update includes a title, detail, and time of the update
const userUpdates = [
  {
    title: "New results from NeuroMod Lab",
    detail: "Real-time decoding of motor intentions from EEG.",
    time: "2h ago",
  },
  {
    title: "SynBio Forge opens internship apps",
    detail: "Applications now open for summer synthetic biology program.",
    time: "5h ago",
  },
];

// Category trends array - shows trending topics and research areas
// Each trend includes title, detail, time, number of boosts, and boost status
const categoryTrends = [
  {
    title: "Transformer models predict cell fate",
    detail: "Large language models now applied to single-cell sequencing.",
    time: "3h ago",
    boosts: 127,
    boosted: false,
  },
  {
    title: "CRISPR base editing breakthrough",
    detail: "A new enzyme enables reversible epigenetic control in vivo.",
    time: "7h ago",
    boosts: 89,
    boosted: false,
  },
  {
    title: "Room-temperature superconductor claims",
    detail: "New research challenges previous ambient superconductivity findings.",
    time: "5h ago",
    boosts: 203,
    boosted: true,
  },
  {
    title: "AlphaFold 3 predicts protein interactions",
    detail: "Enhanced AI model now accurately predicts protein-drug complexes.",
    time: "8h ago",
    boosts: 156,
    boosted: false,
  },
  {
    title: "Quantum error correction milestone",
    detail: "IBM achieves 99.9% fidelity in quantum error correction protocols.",
    time: "12h ago",
    boosts: 94,
    boosted: false,
  },
  {
    title: "Lab-grown brain organoids show memory",
    detail: "Cultured neural tissue demonstrates learning and memory formation.",
    time: "6h ago",
    boosts: 178,
    boosted: false,
  },
];

// Recommended labs array - suggests new or relevant research laboratories
// Each recommendation includes title, detail, and time posted
const recommendedLabs = [
  {
    title: "New lab: Microbiome Dynamics Group",
    detail: "Exploring gut flora influence on neurological disorders.",
    time: "1d ago",
  },
  {
    title: "DeepBio AI joins the platform",
    detail: "Building LLMs for personalized protein synthesis.",
    time: "2d ago",
  },
];

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
  const [dailyBoosts, setDailyBoosts] = useState(3);
  const [boostedItems, setBoostedItems] = useState(new Set<number>());
  const pathname = usePathname();
  
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
    setBoostedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
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
            >
              {/* University Placeholder Image */}
              <div className="w-full h-32 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/10 group-hover:from-yellow-50/20 group-hover:to-yellow-100/20 transition-all duration-300"></div>
                <div className="absolute top-4 left-4 w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-md">
                  <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <svg
                  onClick={() => handleSignalBoost(i)}
                  className={`absolute bottom-2 right-2 w-6 h-6 cursor-pointer transition-colors duration-300 ${boostedItems.has(i) ? 'text-yellow-400 opacity-80' : 'text-gray-600 opacity-60'} group-hover:text-yellow-600 group-hover:opacity-80`}
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12,2L15.09,8.26L22,9L17,14L18.18,21L12,17.77L5.82,21L7,14L2,9L8.91,8.26L12,2Z"/>
                </svg>
              </div>
              <div className="p-4">
                <div className="text-sm font-bold mb-1 group-hover:text-gray-900 transition-colors duration-200">{lab.name}</div>
                <div className="text-xs text-gray-600 mb-2 group-hover:text-gray-700 transition-colors duration-200">{lab.description}</div>
                {lab.location && (
                  <div className="text-xs text-gray-600 mb-2 group-hover:text-gray-700 transition-colors duration-200">Location: {lab.location}</div>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  {(lab.projectTags || []).map((pt: any, j: number) => (
                    pt.Tags?.name && (
                      <span
                        key={j}
                        className={`text-xs border px-2 py-0.5 rounded transition-all duration-200 ${getTagColor(pt.Tags.name)} group-hover:${getTagHoverColor(pt.Tags.name)}`}
                      >
                        {pt.Tags.name}
                      </span>
                    )
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <button className="px-3 py-1 text-xs bg-green-400 text-white rounded hover:bg-green-500 transition-all duration-200 transform hover:scale-105 active:scale-95">
                    Connect
                  </button>
                  <button className="px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-all duration-200 transform hover:scale-105 active:scale-95">
                    Collaborate
                  </button>
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