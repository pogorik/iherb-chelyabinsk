import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Деплой собирает во временную папку и атомарно подменяет .next (см.
  // scripts/deploy-remote.sh) — иначе живой процесс читает наполовину
  // пересобранные файлы прямо во время билда и падает с ошибками вроде
  // "client reference manifest does not exist".
  distDir: process.env.NEXT_DIST_DIR || ".next",
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
