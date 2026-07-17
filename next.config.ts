import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Next 16 blocks upstream images that resolve to a non-unicast IP. This
    // machine's DNS64 resolver answers for Supabase storage with NAT64
    // addresses (64:ff9b::/96) *alongside* the real A records, and that range
    // is not unicast — so uploaded trainer images get rejected locally even
    // though they map to public Cloudflare IPs.
    //
    // Deployed DNS returns no NAT64 records, so keep the check on in
    // production and relax it only for local development.
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
