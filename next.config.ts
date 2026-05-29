import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // OneDrive 等の同期フォルダではファイル監視が不安定になりやすい
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

export default nextConfig;
