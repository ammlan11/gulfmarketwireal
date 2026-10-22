import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  images: {
    remotePatterns: [
      // Production / external HTTPS images
      {
        protocol: "https",
        hostname: "**",
      },

      // Local news CMS development
      {
        protocol: "http",
        hostname: "localhost",
        port: "4000",
        pathname: "/uploads/news/**",
      },
    ],
  },
};

export default nextConfig;
