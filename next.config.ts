import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'mtabskyddtmfrijnulvj.supabase.co',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
