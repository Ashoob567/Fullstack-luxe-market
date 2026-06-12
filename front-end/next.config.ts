// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'iljvzwluibwuxyjavpwb.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      // ✅ Add Unsplash for hero banner images
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;