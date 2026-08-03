// Разовый перенос фото товаров из Supabase Storage в Timeweb S3-хранилище.
// Запуск: npx tsx scripts/migrate-storage-to-s3.ts
// Требует в .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// (источник), а также S3_* и DATABASE_URL (приёмник, Timeweb).
// Запускать ПОСЛЕ scripts/migrate-to-timeweb.ts — иначе таблицу products
// с исходными supabase-ссылками ещё нечего будет обновлять.

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { Pool } from "pg";
import { uploadFile } from "../lib/s3";

const BUCKET = "product-images";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Не заданы NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY в .env.local.");
  process.exit(1);
}
if (!process.env.DATABASE_URL || !process.env.S3_PUBLIC_URL) {
  console.error("Не заданы DATABASE_URL и/или S3_* переменные (Timeweb) в .env.local.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "false" ? undefined : { rejectUnauthorized: false },
});

const oldPrefix = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/`;
const newPrefix = `${process.env.S3_PUBLIC_URL!.replace(/\/$/, "")}/`;

async function listAllFiles(): Promise<string[]> {
  const names: string[] = [];
  const pageSize = 100;
  let offset = 0;

  for (;;) {
    const { data, error } = await supabase.storage.from(BUCKET).list("", {
      limit: pageSize,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw new Error(`Не удалось получить список файлов: ${error.message}`);
    if (!data || data.length === 0) break;

    names.push(...data.map((item) => item.name));
    if (data.length < pageSize) break;
    offset += pageSize;
  }

  return names;
}

function contentTypeFor(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "avif") return "image/avif";
  return "image/jpeg";
}

async function main() {
  console.log("Читаю список файлов из Supabase Storage...");
  const fileNames = await listAllFiles();
  console.log(`  файлов: ${fileNames.length}`);

  let migrated = 0;
  for (const fileName of fileNames) {
    const { data, error } = await supabase.storage.from(BUCKET).download(fileName);
    if (error || !data) {
      console.warn(`  ! не удалось скачать ${fileName}: ${error?.message}`);
      continue;
    }
    const buffer = Buffer.from(await data.arrayBuffer());
    await uploadFile(fileName, buffer, contentTypeFor(fileName));

    migrated += 1;
    if (migrated % 25 === 0 || migrated === fileNames.length) {
      console.log(`  фото: ${migrated}/${fileNames.length}`);
    }
  }

  console.log("Обновляю ссылки на фото в products...");
  const { rows } = await pool.query("select id, image_url, image_urls from products");
  let updated = 0;
  for (const row of rows) {
    const newImageUrl = row.image_url?.startsWith(oldPrefix)
      ? row.image_url.replace(oldPrefix, newPrefix)
      : row.image_url;
    const newImageUrls: string[] = (row.image_urls ?? []).map((url: string) =>
      url.startsWith(oldPrefix) ? url.replace(oldPrefix, newPrefix) : url
    );

    if (newImageUrl !== row.image_url || JSON.stringify(newImageUrls) !== JSON.stringify(row.image_urls)) {
      await pool.query("update products set image_url = $1, image_urls = $2 where id = $3", [
        newImageUrl,
        newImageUrls,
        row.id,
      ]);
      updated += 1;
    }
  }

  console.log(`\nГотово. Перенесено файлов: ${migrated}/${fileNames.length}. Обновлено товаров: ${updated}.`);
  await pool.end();
}

main().catch((error) => {
  console.error("Перенос фото прерван с ошибкой:", error);
  process.exit(1);
});
