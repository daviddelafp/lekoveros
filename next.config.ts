import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      new URL("https://images.pokemontcg.io/**"),
      new URL("https://static.tcgcollector.com/**"),
    ],
  },
};

export default nextConfig;
