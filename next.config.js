/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React's Strict Mode for better development experience
  reactStrictMode: true,
  // Configure image domains for Next.js Image component
  images: {
    domains: ['images.pexels.com', 'media.licdn.com'], // Allow images from these domains
  },
}

module.exports = nextConfig
