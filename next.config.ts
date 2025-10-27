import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Enable experimental features to handle module loading warnings
    esmExternals: 'loose',
  },
  webpack: (config, { isServer }) => {
    // Handle module resolution issues
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      '@react-native-async-storage/async-storage': false,
    };

    // Ignore warnings
    config.ignoreWarnings = [
      {
        module: /node_modules\/@metamask\/sdk/,
        message: /Module not found.*async-storage/,
      },
      {
        module: /node_modules\/@metamask\/sdk/,
        message: /Can't resolve '.*react-native.*'/,
      },
      /Critical dependency: the request of a dependency is an expression/,
      /CommonJS module.*is loading ES Module/,
    ];

    return config;
  },
  // Suppress specific warnings
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
};

export default nextConfig;
