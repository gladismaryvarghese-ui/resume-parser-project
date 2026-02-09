/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/api/proxy/:path*',
          destination: '/api/proxy/:path*',
        },
      ],
    };
  },
};

module.exports = nextConfig; 
