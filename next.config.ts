import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path((?!auth).*)',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'https://karis-atende-api-production.up.railway.app'}/api/:path*`,
      },
    ]
  },
};

export default nextConfig;
