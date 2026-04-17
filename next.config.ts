import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    esmExternals: 'loose',
  },
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      '@react-native-async-storage/async-storage': false,
    };
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
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },

  async headers() {
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://polygon-mainnet.g.alchemy.com https://*.alchemy.com wss://*.walletconnect.org wss://*.walletconnect.com https://*.walletconnect.com https://*.walletconnect.org https://rpc.walletconnect.com https://explorer-api.walletconnect.com https://pulse.walletconnect.org https://api.web3modal.org https://api.goldsky.com https://*.thirdweb.com",
      "frame-src 'self' https://verify.walletconnect.com https://verify.walletconnect.org https://embedded-wallet.thirdweb.com",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join('; ');

    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspDirectives,
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ];
  },
};

export default nextConfig;