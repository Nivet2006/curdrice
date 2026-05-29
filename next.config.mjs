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
}

export default nextConfig