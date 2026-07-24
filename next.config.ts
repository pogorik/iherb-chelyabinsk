import type { NextConfig } from "next";
import path from "path";

// GitHub Pages serves the project from /<repo-name>/, so the base path is
// injected at build time by the deploy workflow (see .github/workflows/deploy.yml).
// Locally (npm run dev / npm run build) BASE_PATH is unset and the app runs at "/".
const basePath = process.env.BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  trailingSlash: true,
  devIndicators: false,
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
