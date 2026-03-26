import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@react-pdf/renderer'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/icons/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
    ]
  },
  // TODO: Enable when Next.js experimental.optimizeCss stabilizes
  // experimental: { optimizeCss: true },
  // TODO: Add next/dynamic for heavy route components:
  // - Dispatch map (src/app/(app)/dispatch/page.tsx) - MapGL is heavy
  // - Analytics charts (src/app/(app)/analytics/*) - Recharts bundle
  // - CRM lane map (src/app/(app)/crm/lanes/*) - MapGL
};

export default nextConfig;
