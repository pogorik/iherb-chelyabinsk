import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";

// Фото товаров хранятся на самом сервере, в папке вне кода приложения
// (её раздаёт nginx по /product-images/). Так у сайта нет внешних зависимостей
// по картинкам. См. также app/api/img (конвертер для VK) и nginx-конфиг.
const DIR = process.env.PRODUCT_IMAGES_DIR || "/var/www/product-images";
const PUBLIC_BASE =
  (process.env.NEXT_PUBLIC_SITE_URL || "https://xn---74-5cdfx1a1d1b.xn--p1ai").replace(/\/$/, "") +
  "/product-images";

function extFromName(name: string): string {
  const e = (name.split(".").pop() || "").toLowerCase();
  if (e === "jpeg") return "jpg";
  return /^(jpg|png|webp|gif)$/.test(e) ? e : "jpg";
}

// Сохраняет загруженное фото на диск, возвращает публичный URL.
export async function saveProductImage(buffer: Buffer, originalName: string): Promise<string> {
  await fs.mkdir(DIR, { recursive: true });
  const name = `${randomUUID()}.${extFromName(originalName)}`;
  await fs.writeFile(path.join(DIR, name), buffer);
  return `${PUBLIC_BASE}/${name}`;
}

export function isLocalImageUrl(url: string): boolean {
  return url.includes("/product-images/");
}

// Удаляет локальный файл по его URL. Внешние ссылки (старый S3/Supabase)
// игнорирует — их файлы не трогаем.
export async function deleteProductImage(url: string): Promise<void> {
  if (!isLocalImageUrl(url)) return;
  const name = path.basename(url.split("?")[0]);
  if (!name) return;
  await fs.unlink(path.join(DIR, name)).catch(() => {});
}
