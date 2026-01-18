/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Fixes for Solana and crypto packages
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      process: false,
      path: false,
      zlib: false,
      http: false,
      https: false,
      stream: false,
    };

    // Ignore node-gyp build errors for optional dependencies
    config.externals.push({
      'bigint-buffer': 'bigint-buffer',
      'tiny-secp256k1': 'tiny-secp256k1',
    });

    return config;
  },
  transpilePackages: ['@solana/web3.js'],
  // Disable static optimization for dynamic imports
  experimental: {
    esmExternals: 'loose',
  },
};

module.exports = nextConfig;
