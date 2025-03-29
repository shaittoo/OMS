/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["firebasestorage.googleapis.com"]
  },
  eslint: {
    ignoreDuringBuilds: true,
  }
};
  
export default nextConfig;