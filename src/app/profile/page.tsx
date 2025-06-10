'use client';

// Import necessary dependencies for the profile page
import { useState } from "react";
import { Home, Search, User, MapPin, Beaker, Target, Edit2, Camera } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Mock data for research labs - contains information about various research laboratories
// Each lab object includes name, category, summary, tags, location, and featured status
const mockLabs = [
  {
    name: "NeuroMod Lab",
    category: "Neuroscience + AI",
    summary: "Rewiring neural pathways through brain-computer interfaces.",
    tags: ["Cognition", "Signal Decoding"],
    location: "California",
    featured: true,
  },
  {
    name: "SynBio Forge",
    category: "Synthetic Biology",
    summary: "Building programmable cells to sense and respond to disease.",
    tags: ["CRISPR", "Metabolic Engineering"],
    location: "Massachusetts",
    featured: true,
  },
  {
    name: "QuantumCore",
    category: "Quantum Materials",
    summary: "Stabilizing quantum dots for practical photonic applications.",
    tags: ["Photonics", "Nanofabrication"],
    location: "New York",
    featured: false,
  },
  {
    name: "EcoGene Systems",
    category: "Environmental Genomics",
    summary: "Tracking biodiversity through DNA shed in ecosystems.",
    tags: ["Metagenomics", "Climate Tracking"],
    location: "Oregon",
    featured: false,
  },
  {
    name: "MetaCell Studio",
    category: "Cellular Modeling",
    summary: "Modeling emergent behavior in organoid development.",
    tags: ["Organoids", "AI Simulation"],
    location: "Texas",
    featured: true,
  },
  {
    name: "CryoPreserve Labs",
    category: "Cryobiology",
    summary: "Advancing cellular preservation techniques for regenerative medicine.",
    tags: ["Cryogenics", "Cell Therapy"],
    location: "Colorado",
    featured: false,
  },
  {
    name: "Photonic Dynamics",
    category: "Optics + Physics",
    summary: "Developing ultra-fast laser systems for precision manufacturing.",
    tags: ["Laser Tech", "Precision Engineering"],
    location: "Arizona",
    featured: true,
  },
  {
    name: "BioCompute Institute",
    category: "Computational Biology",
    summary: "Creating AI models to predict protein folding and drug interactions.",
    tags: ["Machine Learning", "Drug Discovery"],
    location: "Washington",
    featured: false,
  },
  {
    name: "Neural Interface Co.",
    category: "Bioengineering",
    summary: "Pioneering implantable devices for treating neurological disorders.",
    tags: ["Implants", "Neural Stimulation"],
    location: "Minnesota",
    featured: false,
  },
  {
    name: "Fusion Dynamics",
    category: "Energy Physics",
    summary: "Developing compact fusion reactors for clean energy generation.",
    tags: ["Fusion", "Clean Energy"],
    location: "Nevada",
    featured: true,
  },
  {
    name: "Genome Insights",
    category: "Genomics",
    summary: "Mapping rare genetic variants linked to complex diseases.",
    tags: ["Sequencing", "Disease Genetics"],
    location: "Maryland",
    featured: false,
  },
  {
    name: "Nanobot Therapeutics",
    category: "Nanotechnology",
    summary: "Engineering microscopic robots for targeted cancer treatment.",
    tags: ["Nanobots", "Cancer Therapy"],
    location: "North Carolina",
    featured: false,
  },
  {
    name: "Climate Modeling Hub",
    category: "Climate Science",
    summary: "Predicting climate patterns using advanced atmospheric models.",
    tags: ["Climate Data", "Atmospheric Science"],
    location: "Colorado",
    featured: false,
  },
  {
    name: "Bionic Prosthetics",
    category: "Biomedical Engineering",
    summary: "Creating mind-controlled prosthetics with sensory feedback.",
    tags: ["Prosthetics", "Neural Control"],
    location: "Illinois",
    featured: true,
  },
  {
    name: "Space Materials Lab",
    category: "Aerospace Engineering",
    summary: "Developing ultra-lightweight materials for space exploration.",
    tags: ["Aerospace", "Advanced Materials"],
    location: "Florida",
    featured: false,
  },
];

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

// Sample user profile data
const userProfile = {
  name: "Dr. Sarah Chen",
  title: "Research Scientist",
  lab: "SynBio Forge",
  location: "Massachusetts",
  email: "s.chen@synbioforge.org",
  researchProject: "Engineered Microbial Consortiums for Environmental Remediation",
  researchQuestion: "What happens when we engineer multiple bacterial species to work together in degrading plastic pollutants?",
  bio: "Synthetic biologist focused on designing microbial communities for environmental applications. Previously worked on CRISPR-based metabolic engineering at MIT.",
  tags: ["Synthetic Biology", "CRISPR", "Environmental Biotech", "Microbial Engineering"],
  publications: 23,
  citations: 487,
  collaborations: 12,
  hot: true
};

export default function Profile() {
  const [filter, setFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [search, setSearch] = useState("");
  const [dailyBoosts, setDailyBoosts] = useState(3);
  const [boostedItems, setBoostedItems] = useState(new Set());
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState(userProfile);
  const pathname = usePathname();

  const allTags = Array.from(new Set(mockLabs.flatMap((l) => l.tags)));
  const allLocations = Array.from(new Set(mockLabs.map((l) => l.location)));
  const filteredLabs = mockLabs.filter(
    (lab) =>
      (!filter || lab.tags.includes(filter)) &&
      (!locationFilter || lab.location === locationFilter) &&
      (lab.name.toLowerCase().includes(search.toLowerCase()) ||
        lab.summary.toLowerCase().includes(search.toLowerCase()))
  );

  const featuredLabs = mockLabs.filter((lab) => lab.featured);

  const handleSignalBoost = (index: number) => {
    if (dailyBoosts > 0 && !boostedItems.has(index)) {
      setDailyBoosts(prev => prev - 1);
      setBoostedItems(prev => new Set([...prev, index]));
    }
  };

  const handleProfileUpdate = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="flex flex-col min-h-screen bg-stone-50 text-slate-900">
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
          <div className="h-32 bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 relative">
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-2 px-4 py-2 bg-white/90 text-slate-700 text-sm sans border border-white/50 hover:bg-white hover:border-slate-300 transition-all duration-200"
              >
                <Edit2 className="w-4 h-4" />
                {isEditing ? 'Save' : 'Edit Profile'}
              </button>
            </div>
          </div>
          
          <div className="px-8 py-0.5 relative">
            <div className="flex items-start gap-6 -mt-16">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-slate-200 border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                  <div className="text-slate-600 text-2xl font-semibold">
                    {profileData.name.split(' ').map(n => n[0]).join('')}
                  </div>
                </div>
                {isEditing && (
                  <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors duration-200">
                    <Camera className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="flex-1 mt-8">
                <div className="flex items-center gap-4 mb-2">
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => handleProfileUpdate('name', e.target.value)}
                      className="text-2xl font-semibold text-slate-900 border border-slate-300 px-3 py-1 bg-white focus:border-slate-500 focus:outline-none"
                    />
                  ) : (
                    <h1 className="text-2xl font-semibold text-slate-900">{profileData.name}</h1>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-slate-600 mb-4">
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.title}
                      onChange={(e) => handleProfileUpdate('title', e.target.value)}
                      className="text-lg border border-slate-300 px-3 py-1 bg-white focus:border-slate-500 focus:outline-none"
                    />
                  ) : (
                    <span className="text-lg">{profileData.title}</span>
                  )}
                  <span className="text-slate-400">•</span>
                  <div className="flex items-center gap-2">
                    <Beaker className="w-4 h-4" />
                    {isEditing ? (
                      <select
                        value={profileData.lab}
                        onChange={(e) => handleProfileUpdate('lab', e.target.value)}
                        className="border border-slate-300 px-3 py-1 bg-white focus:border-slate-500 focus:outline-none"
                      >
                        {mockLabs.map(lab => (
                          <option key={lab.name} value={lab.name}>{lab.name}</option>
                        ))}
                      </select>
                    ) : (
                      <span>{profileData.lab}</span>
                    )}
                  </div>
                  <span className="text-slate-400">•</span>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{profileData.location}</span>
                  </div>
                </div>
                
                <div className="flex gap-8 text-sm sans">
                  <div className="text-center">
                    <div className="font-semibold text-slate-900">{profileData.publications}</div>
                    <div className="text-slate-600">Publications</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-slate-900">{profileData.citations}</div>
                    <div className="text-slate-600">Citations</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-slate-900">{profileData.collaborations}</div>
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
                    value={profileData.researchProject}
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
                    value={profileData.researchQuestion}
                    onChange={(e) => handleProfileUpdate('researchQuestion', e.target.value)}
                    rows={3}
                    className="w-full text-slate-700 leading-relaxed border border-slate-300 px-4 py-3 bg-white focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-200 resize-none"
                  />
                ) : (
                  <p className="text-slate-700 leading-relaxed bg-emerald-25 border border-emerald-200 p-4 italic">
                    "{profileData.researchQuestion}"
                  </p>
                )}
              </div>
              
              <div>
                <label className="text-sm sans uppercase tracking-widest text-slate-500 mb-3 block">Research Areas</label>
                <div className="flex flex-wrap gap-3">
                  {profileData.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-4 py-2 text-sm sans bg-slate-100 text-slate-700 border border-slate-300"
                    >
                      {tag}
                    </span>
                  ))}
                  {isEditing && (
                    <button className="px-4 py-2 text-sm sans border border-dashed border-slate-400 text-slate-500 hover:border-slate-500 hover:text-slate-600 transition-all duration-200">
                      + Add Tag
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="bg-white border border-slate-200 shadow-sm">
          <div className="px-8 py-6 border-b border-slate-100">
            <h2 className="text-xl font-semibold text-slate-900">About</h2>
          </div>
          <div className="p-8">
            {isEditing ? (
              <textarea
                value={profileData.bio}
                onChange={(e) => handleProfileUpdate('bio', e.target.value)}
                rows={4}
                className="w-full text-slate-700 leading-relaxed border border-slate-300 px-4 py-3 bg-white focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-200 resize-none"
              />
            ) : (
              <p className="text-slate-700 leading-relaxed">{profileData.bio}</p>
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
                    value={profileData.email}
                    onChange={(e) => handleProfileUpdate('email', e.target.value)}
                    className="w-full text-slate-700 border border-slate-300 px-4 py-2 bg-white focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-200"
                  />
                ) : (
                  <p className="text-slate-700">{profileData.email}</p>
                )}
              </div>
              <div>
                <label className="text-sm sans uppercase tracking-widest text-slate-500 mb-2 block">Lab Affiliation</label>
                <p className="text-slate-700">{profileData.lab}</p>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="flex gap-4">
                <button className="px-6 py-3 bg-emerald-600 text-white text-sm sans uppercase tracking-wider hover:bg-emerald-700 transition-all duration-200">
                  Send Message
                </button>
                <button className="px-6 py-3 bg-blue-600 text-white text-sm sans uppercase tracking-wider hover:bg-blue-700 transition-all duration-200">
                  Propose Collaboration
                </button>
                <button className="px-6 py-3 border border-slate-300 text-slate-700 text-sm sans uppercase tracking-wider hover:border-slate-400 hover:bg-slate-50 transition-all duration-200">
                  View Publications
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <nav className="fixed bottom-0 w-full bg-white border-t border-black flex justify-around py-3 shadow-lg sans">
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