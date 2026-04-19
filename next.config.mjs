/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: false,
    },
    webpack: (config, { isServer, webpack }) => {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                "webworker-threads": false,
                "lapack": false,
            };
        }
        config.plugins.push(
            new webpack.IgnorePlugin({
                resourceRegExp: /^(lapack|webworker-threads)$/,
            })
        );
        return config;
    },
}

export default nextConfig