import type { NextConfig } from "next";

// ============================================
// DOCKER-OPTIMIZED NEXT.JS CONFIGURATION
// ============================================
// This configuration works in both development and production (Docker)
// - Development: Direct connection to localhost:3001
// - Production: nginx reverse proxy handles all routing
// - No hardcoded IPs required
// ============================================

const nextConfig: NextConfig = {
  /* config options here */

  // CORS headers (not needed in Docker as nginx handles this)
  // But kept for development mode compatibility
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Credentials",
            value: "true",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,OPTIONS,PATCH,DELETE,POST,PUT",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
