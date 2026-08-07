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
  // Отдаём VK-фид ещё и по адресу с расширением .yml — VK в поле импорта
  // ждёт ссылку вида https://site/file.yml. Это тот же живой эндпоинт
  // /api/vk-feed (динамический, из базы), просто «красивый» адрес.
  async rewrites() {
    return [{ source: "/vk.yml", destination: "/api/vk-feed" }];
  },
};

export default nextConfig;
