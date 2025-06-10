"use client";

import React, { useState } from "react";
import { Home, Search, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const mockLabs = [
  { name: "NeuroMod Lab", category: "Neuroscience + AI", summary: "Rewiring neural pathways through brain-computer interfaces.", tags: ["Cognition", "Signal Decoding"], location: "California", featured: true },
  { name: "SynBio Forge", category: "Synthetic Biology", summary: "Building programmable cells to sense and respond to disease.", tags: ["CRISPR", "Metabolic Engineering"], location: "Massachusetts", featured: true },
  { name: "QuantumCore", category: "Quantum Materials", summary: "Stabilizing quantum dots for practical photonic applications.", tags: ["Photonics", "Nanofabrication"], location: "New York", featured: false },
  { name: "EcoGene Systems", category: "Environmental Genomics", summary: "Tracking biodiversity through DNA shed in ecosystems.", tags: ["Metagenomics", "Climate Tracking"], location: "Oregon", featured: false },
  { name: "MetaCell Studio", category: "Cellular Modeling", summary: "Modeling emergent behavior in organoid development.", tags: ["Organoids", "AI Simulation"], location: "Texas", featured: true },
  { name: "CryoPreserve Labs", category: "Cryobiology", summary: "Advancing cellular preservation techniques for regenerative medicine.", tags: ["Cryogenics", "Cell Therapy"], location: "Colorado", featured: false },
  { name: "Photonic Dynamics", category: "Optics + Physics", summary: "Developing ultra-fast laser systems for precision manufacturing.", tags: ["Laser Tech", "Precision Engineering"], location: "Arizona", featured: true },
  { name: "BioCompute Institute", category: "Computational Biology", summary: "Creating AI models to predict protein folding and drug interactions.", tags: ["Machine Learning", "Drug Discovery"], location: "Washington", featured: false },
  { name: "Neural Interface Co.", category: "Bioengineering", summary: "Pioneering implantable devices for treating neurological disorders.", tags: ["Implants", "Neural Stimulation"], location: "Minnesota", featured: false },
  { name: "Fusion Dynamics", category: "Energy Physics", summary: "Developing compact fusion reactors for clean energy generation.", tags: ["Fusion", "Clean Energy"], location: "Nevada", featured: true },
  { name: "Genome Insights", category: "Genomics", summary: "Mapping rare genetic variants linked to complex diseases.", tags: ["Sequencing", "Disease Genetics"], location: "Maryland", featured: false },
  { name: "Nanobot Therapeutics", category: "Nanotechnology", summary: "Engineering microscopic robots for targeted cancer treatment.", tags: ["Nanobots", "Cancer Therapy"], location: "North Carolina", featured: false },
  { name: "Climate Modeling Hub", category: "Climate Science", summary: "Predicting climate patterns using advanced atmospheric models.", tags: ["Climate Data", "Atmospheric Science"], location: "Colorado", featured: false },
  { name: "Bionic Prosthetics", category: "Biomedical Engineering", summary: "Creating mind-controlled prosthetics with sensory feedback.", tags: ["Prosthetics", "Neural Control"], location: "Illinois", featured: true },
  { name: "Space Materials Lab", category: "Aerospace Engineering", summary: "Developing ultra-lightweight materials for space exploration.", tags: ["Aerospace", "Advanced Materials"], location: "Florida", featured: false },
];

const userUpdates = [
  { title: "New results from NeuroMod Lab", detail: "Real-time decoding of motor intentions from EEG.", time: "2h ago" },
  { title: "SynBio Forge opens internship apps", detail: "Applications now open for summer synthetic biology program.", time: "5h ago" },
];

const categoryTrends = [
  { title: "Transformer models predict cell fate", detail: "Large language models now applied to single-cell sequencing.", time: "3h ago", boosts: 127, boosted: false },
  { title: "CRISPR base editing breakthrough", detail: "A new enzyme enables reversible epigenetic control in vivo.", time: "7h ago", boosts: 89, boosted: false },
  { title: "Room-temperature superconductor claims", detail: "New research challenges previous ambient superconductivity findings.", time: "5h ago", boosts: 203, boosted: true },
  { title: "AlphaFold 3 predicts protein interactions", detail: "Enhanced AI model now accurately predicts protein-drug complexes.", time: "8h ago", boosts: 156, boosted: false },
  { title: "Quantum error correction milestone", detail: "IBM achieves 99.9% fidelity in quantum error correction protocols.", time: "12h ago", boosts: 94, boosted: false },
  { title: "Lab-grown brain organoids show memory", detail: "Cultured neural tissue demonstrates learning and memory formation.", time: "6h ago", boosts: 178, boosted: false },
];

const recommendedLabs = [
  { title: "New lab: Microbiome Dynamics Group", detail: "Exploring gut flora influence on neurological disorders.", time: "1d ago" },
  { title: "DeepBio AI joins the platform", detail: "Building LLMs for personalized protein synthesis.", time: "2d ago" },
];

export default function Feed() {
  const [dailyBoosts, setDailyBoosts] = useState(3);
  const [boostedItems, setBoostedItems] = useState(new Set());
  const pathname = usePathname();

  const handleSignalBoost = (index: number) => {
    if (dailyBoosts > 0 && !boostedItems.has(index)) {
      setDailyBoosts(prev => prev - 1);
      setBoostedItems(prev => new Set([...prev, index]));
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans text-gray-900">
      <header className="flex items-center justify-between px-4 py-3 border-b border-black bg-white uppercase tracking-wide">
        <div className="flex items-center gap-3">
          <h1 className="text-md font-bold">Genesis</h1>
          <span className="text-xs text-gray-600 font-medium tracking-wider">Where Breakthroughs Begin</span>
        </div>
        <div></div>
      </header>

      <div className="flex-1 p-6 space-y-10 pb-32">
        <div className="rounded-lg border border-gray-300 p-4 bg-white shadow-sm">
          <h2 className="text-lg font-bold mb-4 border-b pb-2">Labs You Follow</h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {userUpdates.map((item, i: number) => (
              <div
                key={i}
                className="p-4 border border-gray-200 rounded-lg bg-gray-50 hover:border-blue-500 hover:shadow-md transition duration-200"
              >
                <div className="font-semibold text-md mb-1">{item.title}</div>
                <div className="text-sm text-gray-600 mb-1">{item.detail}</div>
                <div className="text-xs text-gray-400">{item.time}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-gray-300 p-4 bg-white shadow-sm">
          <h2 className="text-lg font-bold mb-4 border-b pb-2 flex items-center justify-between">
            Trending Topics
            <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {dailyBoosts} Signal Boosts Left
            </div>
          </h2>
          <div className="space-y-4">
            {categoryTrends.map((item, i: number) => (
              <div
                key={i}
                className="p-4 border-l-4 border-orange-400 bg-orange-50 hover:bg-orange-100 transition"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium text-md">{item.title}</div>
                    <div className="text-sm text-gray-700">{item.detail}</div>
                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-3">
                      <span>{item.time}</span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12,2L15.09,8.26L22,9L17,14L18.18,21L12,17.77L5.82,21L7,14L2,9L8.91,8.26L12,2Z"/>
                        </svg>
                        {item.boosts} boosts
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSignalBoost(i)}
                    disabled={dailyBoosts === 0 || boostedItems.has(i)}
                    className={`ml-3 px-3 py-1 text-xs rounded transition-all duration-200 ${
                      boostedItems.has(i)
                        ? 'bg-green-500 text-white cursor-not-allowed'
                        : dailyBoosts === 0
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-orange-500 text-white hover:bg-orange-600 active:scale-95'
                    }`}
                  >
                    {boostedItems.has(i) ? '✓ Boosted' : 'Signal Boost'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-gray-300 p-4 bg-white shadow-sm">
          <h2 className="text-lg font-bold mb-4 border-b pb-2">Recommended</h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {recommendedLabs.map((item, i: number) => (
              <div
                key={i}
                className="p-4 border border-gray-200 rounded-lg bg-gray-50 hover:border-green-400 hover:shadow-md transition duration-200"
              >
                <div className="font-semibold text-md mb-1">{item.title}</div>
                <div className="text-sm text-gray-600 mb-1">{item.detail}</div>
                <div className="text-xs text-gray-400">{item.time}</div>
              </div>
            ))}
          </div>
        </div>
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