"use client";

// Import necessary dependencies for the about page
import { Home as HomeIcon, Search, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

// About component - displays information about Genesis and its founders
export default function About() {
  return (
    <div className="flex flex-col min-h-screen bg-white font-sans text-gray-900">
      {/* Header section with app title and tagline */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-black bg-white uppercase tracking-wide">
        <div className="flex items-center gap-3">
          <h1 className="text-md font-bold">Genesis</h1>
          <span className="text-xs text-gray-600 font-medium tracking-wider">Where Breakthroughs Begin</span>
        </div>
        <div></div>
      </header>

      {/* Main content section */}
      <main className="flex-1 px-6 py-8 max-w-6xl mx-auto">
        {/* Introduction section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">About Genesis</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Genesis is revolutionizing the way scientific research is funded and conducted. 
            Our platform connects innovative researchers with the resources they need to make 
            breakthrough discoveries that shape the future of science.
          </p>
        </div>

        {/* Founders section - displays information about the company founders */}
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          {/* Bowen Kim's profile card */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
            <div className="relative h-64">
              <Image
                src="https://media.licdn.com/dms/image/D5603AQF8QzQZQJqQYw/profile-displayphoto-shrink_800_800/0/1709337600000?e=1721865600&v=beta&t=YQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQ"
                alt="Bowen Kim"
                fill
                className="object-cover"
              />
            </div>
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-2">Bowen Kim</h2>
              <p className="text-gray-600 mb-4">Co-Founder & CEO</p>
              <p className="text-gray-700 mb-4">
                Bowen brings extensive experience in technology and entrepreneurship to Genesis. 
                With a background in computer science and a passion for scientific innovation, 
                he leads our mission to transform research funding and collaboration.
              </p>
              <a
                href="https://www.linkedin.com/in/bowenkim/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-blue-600 hover:text-blue-800"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
                Connect on LinkedIn
              </a>
            </div>
          </div>

          {/* Sam Rogers' profile card */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
            <div className="relative h-64">
              <Image
                src="https://media.licdn.com/dms/image/D5603AQF8QzQZQJqQYw/profile-displayphoto-shrink_800_800/0/1709337600000?e=1721865600&v=beta&t=YQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQ"
                alt="Sam Rogers"
                fill
                className="object-cover"
              />
            </div>
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-2">Sam Rogers</h2>
              <p className="text-gray-600 mb-4">Co-Founder & CTO</p>
              <p className="text-gray-700 mb-4">
                Sam is a technology leader with deep expertise in building scalable platforms. 
                His vision for Genesis combines cutting-edge technology with scientific research 
                to create a more efficient and collaborative research ecosystem.
              </p>
              <a
                href="https://www.linkedin.com/in/samrogers5/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-blue-600 hover:text-blue-800"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
                Connect on LinkedIn
              </a>
            </div>
          </div>
        </div>

        {/* Mission statement section */}
        <div className="bg-gray-50 rounded-lg p-8 border border-gray-200">
          <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
          <p className="text-gray-700 mb-4">
            At Genesis, we believe that scientific progress should be accessible to all. 
            Our platform bridges the gap between innovative researchers and the resources 
            they need to make groundbreaking discoveries. By leveraging technology and 
            fostering collaboration, we're creating a future where scientific breakthroughs 
            happen faster and more efficiently.
          </p>
          <p className="text-gray-700">
            Join us in our mission to accelerate scientific discovery and create a better 
            future through research and innovation.
          </p>
        </div>
      </main>

      {/* Bottom navigation bar - provides quick access to main sections */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-black flex justify-around py-3 shadow-lg">
        <Link
          href="/"
          className="flex flex-col items-center transition-colors duration-200 text-black hover:text-gray-600"
        >
          <HomeIcon className="w-5 h-5" />
          <span className="text-xs mt-1">Feed</span>
        </Link>
        <Link
          href="/"
          className="flex flex-col items-center transition-colors duration-200 text-black hover:text-gray-600"
        >
          <Search className="w-5 h-5" />
          <span className="text-xs mt-1">Explore</span>
        </Link>
        <Link
          href="/profile"
          className="flex flex-col items-center text-black hover:text-gray-600 transition-colors duration-200"
        >
          <User className="w-5 h-5" />
          <span className="text-xs mt-1">Profile</span>
        </Link>
      </nav>
    </div>
  );
} 