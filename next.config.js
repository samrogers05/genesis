/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React's Strict Mode for better development experience
  reactStrictMode: true,
  // Configure image domains for Next.js Image component
  images: {
    domains: ['images.pexels.com', 'media.licdn.com', 'fdlsmxwsjajabqjgumve.supabase.co'], // Allow images from these domains
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('@supabase/realtime-js');
    }
    return config;
  },
}

module.exports = nextConfig
