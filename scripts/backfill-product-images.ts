// Одноразовая дозагрузка ВСЕХ доступных фото (2-4 шт.) для товаров, которые
// уже импортированы в Supabase (scripts/import-scraped-products.ts взял
// только первое фото на товар). Не трогает ничего, кроме image_url/image_urls
// — не пересоздаёт и не удаляет товары.
// Запуск: npx tsx scripts/backfill-product-images.ts
// Требует SUPABASE_SERVICE_ROLE_KEY в .env.local (обходит RLS, никогда не коммитить).

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import sharp from "sharp";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Не заданы NEXT_PUBLIC_SUPABASE_URL и/или SUPABASE_SERVICE_ROLE_KEY в .env.local.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const SOURCE_ROOT = "C:\\Users\\Ivan\\Desktop\\товары";
const INBLOSSOM_DIR = path.win32.join(SOURCE_ROOT, "output");
const INBLOSSOM_XLSX = path.win32.join(INBLOSSOM_DIR, "inblossom_iherb_brands.xlsx");
const NUTRI_DIR = path.win32.join(SOURCE_ROOT, "output_nutricionica");
const NUTRI_XLSX = path.win32.join(NUTRI_DIR, "nutricionica_iherb_brands.xlsx");

function readSheetRows(filePath: string): unknown[][] {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" }).slice(1);
}

// Имена файлов сами содержат запятые (полное название товара), поэтому
// разделять несколько путей в ячейке можно только по границе "images\".
function allImagePaths(baseDir: string, localPathsCell: string): string[] {
  if (!localPathsCell) return [];
  return localPathsCell
    .split(/,\s*(?=images[\\/])/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => path.win32.join(baseDir, p));
}

interface SlugPaths {
  slug: string;
  paths: string[];
}

function collectInblossom(): SlugPaths[] {
  const rows = readSheetRows(INBLOSSOM_XLSX);
  return rows
    .map((row) => {
      const [, , articul, , , , , , photosCell] = row as string[];
      if (!articul) return null;
      return { slug: `inb-${articul}`, paths: allImagePaths(INBLOSSOM_DIR, String(photosCell || "")) };
    })
    .filter((x): x is SlugPaths => x !== null);
}

function collectNutricionica(): SlugPaths[] {
  const rows = readSheetRows(NUTRI_XLSX);
  return rows
    .map((row) => {
      const [, , idRaw, , , , , , , photosCell] = row as string[];
      if (!idRaw) return null;
      return { slug: `nutri-${idRaw}`, paths: allImagePaths(NUTRI_DIR, String(photosCell || "")) };
    })
    .filter((x): x is SlugPaths => x !== null);
}

async function uploadExtra(slug: string, index: number, filePath: string): Promise<string | null> {
  if (!fs.existsSync(filePath)) {
    console.warn(`  ! файл не найден: ${filePath}`);
    return null;
  }
  try {
    const inputBuffer = fs.readFileSync(filePath);
    const webpBuffer = await sharp(inputBuffer)
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const storagePath = `${slug}-${index}.webp`;
    const { error } = await supabase.storage
      .from("product-images")
      .upload(storagePath, webpBuffer, { upsert: true, contentType: "image/webp" });

    if (error) {
      console.warn(`  ! не удалось загрузить ${storagePath}: ${error.message}`);
      return null;
    }

    const { data } = supabase.storage.from("product-images").getPublicUrl(storagePath);
    return data.publicUrl;
  } catch (err) {
    console.warn(`  ! ошибка обработки фото ${slug}-${index}:`, (err as Error).message);
    return null;
  }
}

async function main() {
  console.log("Читаю списки фото из xlsx...");
  const bySlug = new Map<string, string[]>();
  for (const { slug, paths } of [...collectInblossom(), ...collectNutricionica()]) {
    bySlug.set(slug, paths);
  }
  console.log(`  товаров с данными о фото: ${bySlug.size}`);

  console.log("Читаю текущие товары из Supabase...");
  const { data: products, error } = await supabase.from("products").select("id, slug, image_url, image_urls");
  if (error) throw new Error(`select products: ${error.message}`);
  console.log(`  товаров в базе: ${products?.length ?? 0}`);

  const candidates = (products ?? []).filter((p) => {
    const localPaths = bySlug.get(p.slug);
    return localPaths && localPaths.length > 1 && (p.image_urls?.length ?? 0) < localPaths.length;
  });
  console.log(`Товаров, которым не хватает фото: ${candidates.length}`);

  let done = 0;
  for (const product of candidates) {
    const localPaths = bySlug.get(product.slug)!;
    // Первое фото уже загружено исходным импортом как `${slug}.webp`.
    const existingFirst = product.image_url ?? null;
    const extraUrls: string[] = [];
    for (let i = 1; i < localPaths.length; i++) {
      const url = await uploadExtra(product.slug, i + 1, localPaths[i]);
      if (url) extraUrls.push(url);
    }

    const imageUrls = [existingFirst, ...extraUrls].filter((x): x is string => Boolean(x));
    if (imageUrls.length === 0) continue;

    const { error: updateError } = await supabase
      .from("products")
      .update({ image_urls: imageUrls })
      .eq("id", product.id);

    if (updateError) {
      console.warn(`  ! не удалось обновить ${product.slug}: ${updateError.message}`);
    } else {
      done += 1;
    }

    if (done % 25 === 0) console.log(`  ✓ ${done}/${candidates.length}`);
  }

  console.log(`\nГотово. Обновлено товаров: ${done}/${candidates.length}.`);
}

main().catch((error) => {
  console.error("Дозагрузка прервана с ошибкой:", error);
  process.exit(1);
});
