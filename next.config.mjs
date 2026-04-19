/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
        ignoreBuildErrors: false,
    },
    transpilePackages: ['otplib'],
    turbopack: {},
}

export default nextConfig