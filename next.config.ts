import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: process.cwd(),
  // Hide the Next.js development indicator ("N" badge) in the bottom-left corner.
  devIndicators: false
};

export default nextConfig;
