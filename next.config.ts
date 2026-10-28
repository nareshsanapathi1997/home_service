import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Allows 5 MB photo and document uploads through server actions.
    serverActions: { bodySizeLimit: "6mb" },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
