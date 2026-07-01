/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Handle WebSocket modules for Socket.IO
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }

    // Exclude WebSocket-related modules from client-side bundle
    config.externals.push({
      'utf-8-validate': 'utf-8-validate',
      'bufferutil': 'bufferutil',
      'supports-color': 'supports-color',
    });

    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['socket.io', 'socket.io-client'],
  },
  images: {
    unoptimized: true, // Recommandé pour Netlify si pas de plan payant
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
};

module.exports = nextConfig;
