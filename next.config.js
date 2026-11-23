/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export", // static export → deploy anywhere, including Vercel free tier
  images: { unoptimized: true },
};

module.exports = nextConfig;