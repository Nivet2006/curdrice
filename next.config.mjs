/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
        ignoreBuildErrors: false,
    },
    transpilePackages: ['otplib'],
    experimental: {
        serverExternalPackages: ['chartjs-node-canvas', 'canvas'],
    },
}

export default nextConfig