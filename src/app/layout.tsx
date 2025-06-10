// Import required styles and types
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

// Configure the Inter font with Latin subset and CSS variable
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

// Define metadata for the application
// This information is used for SEO and browser tab display
export const metadata: Metadata = {
  title: 'Genesis',
  description: 'AI-powered research funding platform',
}

// Root layout component that wraps all pages in the application
// This is the main template that every page will inherit from
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      {/* Apply the Inter font to the entire application */}
      <body className={inter.className}>{children}</body>
    </html>
  )
}
