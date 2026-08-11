import { createHash } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";

// Конвертер фото товаров в JPEG для VK Market: VK принимает только JPG/PNG/GIF,
// а фото в базе — webp. Отдаём тот же файл в JPEG (белая подложка вместо
// прозрачности), с дисковым кэшем, чтобы не пережимать при каждом опросе VK.
export const dynamic = "force-dynamic";

// Фото товаров теперь хранятся на самом сервере (/var/www/product-images,
// раздаётся nginx по /product-images/). Локальные адреса читаем прямо с диска.
const LOCAL_DIR = "/var/www/product-images";
const LOCAL_PREFIXES = [
  "https://xn---74-5cdfx1a1d1b.xn--p1ai/product-images/",
  "https://айхерб-74.рф/product-images/",
];

// Разрешаем конвертировать только наши фото — иначе это открытый прокси (SSRF).
// Старые внешние хосты оставлены на случай ещё не перенесённых ссылок.
const ALLOWED_PREFIXES = [
  ...LOCAL_PREFIXES,
  "https://hfiaquyffhnkmqybooyu.supabase.co/storage/v1/object/public/product-images/",
  "https://s3.twcstorage.ru/",
];

// Кэш вне каталога приложения, чтобы деплой (rsync --delete) его не сносил.
const CACHE_DIR = "/var/tmp/vk-img-cache";
const MIN_SIDE = 400; // требование VK — минимум 400×400

// Загружает исходник: локальные фото — с диска, внешние — по сети.
async function loadSource(src: string): Promise<Buffer | null> {
  for (const pre of LOCAL_PREFIXES) {
    if (src.startsWith(pre)) {
      const name = path.basename(decodeURIComponent(src.slice(pre.length).split("?")[0]));
      try {
        return await fs.readFile(path.join(LOCAL_DIR, name));
      } catch {
        return null;
      }
    }
  }
  try {
    const res = await fetch(src);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const src = new URL(request.url).searchParams.get("src");
  if (!src || !ALLOWED_PREFIXES.some((pre) => src.startsWith(pre))) {
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

  const input = await loadSource(src);
  if (!input) return new Response("source unavailable", { status: 502 });
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
