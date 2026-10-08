import type { NextConfig } from "next";

try {
  // Automatically ensure assets folder junction and synchronization
  require("./sync-assets.js");
} catch {
  // ignore
}

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
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
