import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Provide async_hooks polyfill for Cloudflare Workers
      config.resolve.alias = {
        ...config.resolve.alias,
        async_hooks: path.resolve('./async_hooks.js'),
      };
    }
    return config;
  },
};

export default nextConfig;
