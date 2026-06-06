/** @type {import('next').NextConfig} */
const nextConfig = {
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
                hostname: process.env.NEXT_PUBLIC_SITE_URL
                    ? new URL(process.env.NEXT_PUBLIC_SITE_URL).hostname
                    : 'localhost',
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
}

export default nextConfig