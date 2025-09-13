/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed 'output: export' to enable server-side features for Clerk authentication
  // trailingSlash: true,  // Not needed without static export
  // images: {
  //   unoptimized: true,  // Not needed without static export
  // },
};

export default nextConfig;
