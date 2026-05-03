/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
        ignoreBuildErrors: false,
    },
    transpilePackages: ['otplib'],
    serverExternalPackages: ['chartjs-node-canvas', 'canvas'],
}

export default nextConfig