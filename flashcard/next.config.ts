/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config: { resolve: { alias: { framer: string; }; }; }) => {
    config.resolve.alias.framer = 'framer-motion/legacy';
    return config;
  },
  images: {
    domains: [
      'lh3.googleusercontent.com', // For Google profile pictures
      // Add other domains if needed, e.g.:
      // 'example.com',
      // 'yourapp.com'
    ]
  },
  // Other Next.js configurations can go here
};

module.exports = nextConfig;