import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/weather",
        destination: "/",
        permanent: true,
      },
      {
        source: "/weather/api",
        destination: "https://docs.maybesurya.dev",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
