/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    TWELVEDATA_API_KEY: process.env.TWELVEDATA_API_KEY,
  },
};

module.exports = nextConfig;

const TWELVE_DATA_API_KEY = "3f3d883fca5a4a2ca18a03beffcf1770";
