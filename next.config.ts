import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Disable instrumentation which requires async_hooks
    instrumentationHook: false,
  },
  webpack: (config, { isServer, webpack }) => {
    if (isServer) {
      // Provide async_hooks polyfill for Cloudflare Workers
      config.resolve.alias = {
        ...config.resolve.alias,
        async_hooks: path.resolve('./async_hooks.js'),
      };

      // Add fallback for async_hooks
      config.resolve.fallback = {
        ...config.resolve.fallback,
        async_hooks: path.resolve('./async_hooks.js'),
      };
    }
    return config;
  },
};

export default nextConfig;
