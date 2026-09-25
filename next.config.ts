import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async redirects() {
    return [
      {
        source: "/weather",
        destination: "/",
        permanent: true,
      },
      {
        source: "/weather/api",
        destination: "https://docs.maybesurya.dev/weather/overview",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
