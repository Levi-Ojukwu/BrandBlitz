import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for Docker standalone builds — reduces image 500MB → ~150MB
  output: "standalone",

  images: {
    remotePatterns: [
      // Google OAuth avatars
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      // MinIO dev / R2 prod
      { protocol: "http", hostname: "localhost" },
      { protocol: "https", hostname: "assets.brandblitz.app" },
    ],
  },

  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "brandblitz.app"],
    },
  },
};

export default nextConfig;
