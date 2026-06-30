const getHostname = (urlStr) => {
  if (!urlStr) return 'localhost';
  try {
    const withProto = urlStr.startsWith('http') ? urlStr : `https://${urlStr}`;
    return new URL(withProto).hostname;
  } catch {
    return 'localhost';
  }
};

/** @type {import('next').NextConfig} */
const nextConfig = {
    poweredByHeader: false,
    typescript: {
        ignoreBuildErrors: false,
    },
    transpilePackages: ['otplib'],
    serverExternalPackages: ['chartjs-node-canvas', 'canvas'],
    turbopack: {},
    webpack: (config, { isServer }) => {
        if (isServer) {
            config.resolve.alias = {
                ...config.resolve.alias,
                canvas: false,
            };
        }
        return config;
    },
    images: {
        remotePatterns: [
            {
                // Allow your own proxy route — handles both dev and prod
                protocol: 'https',
                hostname: getHostname(process.env.NEXT_PUBLIC_SITE_URL),
                pathname: '/api/assets/**',
            },
            {
                // Direct B2 access as fallback during dev
                protocol: 'https',
                hostname: '*.backblazeb2.com',
                pathname: '/**',
            },
        ],
    },
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                ],
            },
        ];
    },
}

export default nextConfig