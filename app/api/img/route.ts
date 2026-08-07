import { createHash } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";

// Конвертер фото товаров в JPEG для VK Market: VK принимает только JPG/PNG/GIF,
// а фото в базе — webp. Отдаём тот же файл в JPEG (белая подложка вместо
// прозрачности), с дисковым кэшем, чтобы не пережимать при каждом опросе VK.
export const dynamic = "force-dynamic";

// Разрешаем проксировать только фото из нашего бакета — иначе это был бы
// открытый прокси (SSRF).
const ALLOWED_PREFIX =
  "https://hfiaquyffhnkmqybooyu.supabase.co/storage/v1/object/public/product-images/";

// Кэш вне каталога приложения, чтобы деплой (rsync --delete) его не сносил.
const CACHE_DIR = "/var/tmp/vk-img-cache";
const MIN_SIDE = 400; // требование VK — минимум 400×400

export async function GET(request: Request) {
  const src = new URL(request.url).searchParams.get("src");
  if (!src || !src.startsWith(ALLOWED_PREFIX)) {
    return new Response("bad src", { status: 400 });
  }

  const key = createHash("sha1").update(src).digest("hex");
  const cachePath = path.join(CACHE_DIR, `${key}.jpg`);

  // Отдаём из кэша, если уже конвертировали.
  try {
    const cached = await fs.readFile(cachePath);
    return jpegResponse(cached);
  } catch {
    // промах кэша — конвертируем ниже
  }

  let upstream: Response;
  try {
    upstream = await fetch(src);
  } catch {
    return new Response("fetch failed", { status: 502 });
  }
  if (!upstream.ok) return new Response("upstream error", { status: 502 });

  const input = Buffer.from(await upstream.arrayBuffer());
  let img = sharp(input).flatten({ background: "#ffffff" });
  const meta = await sharp(input).metadata();
  if ((meta.width ?? 0) < MIN_SIDE || (meta.height ?? 0) < MIN_SIDE) {
    // мелкие изображения увеличиваем до минимально допустимого VK.
    img = img.resize({ width: MIN_SIDE, height: MIN_SIDE, fit: "contain", background: "#ffffff" });
  }
  const jpeg = await img.jpeg({ quality: 82 }).toBuffer();

  // Пишем в кэш (не критично, если не удалось).
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    await fs.writeFile(cachePath, jpeg);
  } catch {
    // игнорируем ошибки кэша
  }

  return jpegResponse(jpeg);
}

function jpegResponse(body: Buffer): Response {
  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=604800, immutable",
    },
  });
}
