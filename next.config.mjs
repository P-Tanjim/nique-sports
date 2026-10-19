/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  images: {
    deviceSizes: [480, 640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    qualities: [50, 55, 60, 65, 75],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Allows large uploads site-wide so Next.js doesn't throw a network error
    },
  },
};

export default nextConfig;
