// Разовый перенос данных со старого Supabase-проекта на Timeweb Postgres.
// Запуск: npx tsx scripts/migrate-to-timeweb.ts
// Требует в .env.local одновременно: NEXT_PUBLIC_SUPABASE_URL,
// SUPABASE_SERVICE_ROLE_KEY (источник) и DATABASE_URL (приёмник, Timeweb).

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { Pool } from "pg";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Не заданы NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY в .env.local.");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("Не задан DATABASE_URL (Timeweb Postgres) в .env.local.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "false" ? undefined : { rejectUnauthorized: false },
});

async function migrateTaxonomy(table: "purposes" | "brands" | "active_components") {
  const { data, error } = await supabase.from(table).select("slug, label");
  if (error) throw new Error(`${table}: ${error.message}`);

  for (const row of data ?? []) {
    await pool.query(
      `insert into ${table} (slug, label) values ($1, $2)
       on conflict (slug) do update set label = excluded.label`,
      [row.slug, row.label]
    );
  }
  console.log(`✓ ${table}: ${data?.length ?? 0}`);
}

async function migrateSiteSettings() {
  const { data, error } = await supabase.from("site_settings").select("*").limit(1).maybeSingle();
  if (error) throw new Error(`site_settings: ${error.message}`);
  if (!data) {
    console.log("… site_settings: нет строки в источнике, пропущено");
    return;
  }

  await pool.query(
    `insert into site_settings (
       id, name, tagline, hero_title, hero_subtitle, phone, phone_href, whatsapp_number,
       telegram_username, max_href, email, address, working_hours, vk_url, pickup_info
     ) values (1,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     on conflict (id) do update set
       name = excluded.name, tagline = excluded.tagline, hero_title = excluded.hero_title,
       hero_subtitle = excluded.hero_subtitle, phone = excluded.phone, phone_href = excluded.phone_href,
       whatsapp_number = excluded.whatsapp_number, telegram_username = excluded.telegram_username,
       max_href = excluded.max_href, email = excluded.email, address = excluded.address,
       working_hours = excluded.working_hours, vk_url = excluded.vk_url, pickup_info = excluded.pickup_info`,
    [
      data.name,
      data.tagline,
      data.hero_title,
      data.hero_subtitle,
      data.phone,
      data.phone_href,
      data.whatsapp_number,
      data.telegram_username,
      data.max_href,
      data.email,
      data.address,
      data.working_hours,
      data.vk_url,
      data.pickup_info,
    ]
  );
  console.log("✓ site_settings: 1 запись");
}

async function migrateProducts() {
  const { data, error } = await supabase.from("products").select("*").order("name");
  if (error) throw new Error(`products: ${error.message}`);

  for (const row of data ?? []) {
    await pool.query(
      `insert into products (
         id, slug, name, brand, price, old_price, age_group, purposes, active_components,
         form, volume, description, rating, reviews_count, in_stock, stock_quantity,
         is_hit, accent, image_url, image_urls, created_at, updated_at
       ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
       on conflict (id) do update set
         slug = excluded.slug, name = excluded.name, brand = excluded.brand, price = excluded.price,
         old_price = excluded.old_price, age_group = excluded.age_group, purposes = excluded.purposes,
         active_components = excluded.active_components, form = excluded.form, volume = excluded.volume,
         description = excluded.description, rating = excluded.rating, reviews_count = excluded.reviews_count,
         in_stock = excluded.in_stock, stock_quantity = excluded.stock_quantity, is_hit = excluded.is_hit,
         accent = excluded.accent, image_url = excluded.image_url, image_urls = excluded.image_urls,
         updated_at = excluded.updated_at`,
      [
        row.id,
        row.slug,
        row.name,
        row.brand,
        row.price,
        row.old_price,
        row.age_group,
        row.purposes ?? [],
        row.active_components ?? [],
        row.form,
        row.volume,
        row.description ?? "",
        row.rating ?? 0,
        row.reviews_count ?? 0,
        row.in_stock,
        row.stock_quantity ?? 0,
        row.is_hit ?? false,
        row.accent ?? "brand",
        row.image_url,
        row.image_urls ?? [],
        row.created_at,
        row.updated_at,
      ]
    );
  }
  console.log(`✓ products: ${data?.length ?? 0}`);
}

async function migrateOrders() {
  const { data, error } = await supabase.from("orders").select("*").order("created_at");
  if (error) throw new Error(`orders: ${error.message}`);

  for (const row of data ?? []) {
    await pool.query(
      `insert into orders (id, created_at, customer_name, customer_phone, fulfillment, customer_comment, items, total_price, status)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       on conflict (id) do nothing`,
      [
        row.id,
        row.created_at,
        row.customer_name,
        row.customer_phone,
        row.fulfillment,
        row.customer_comment,
        JSON.stringify(row.items),
        row.total_price,
        row.status,
      ]
    );
  }
  console.log(`✓ orders: ${data?.length ?? 0}`);
}

async function main() {
  await migrateTaxonomy("purposes");
  await migrateTaxonomy("brands");
  await migrateTaxonomy("active_components");
  await migrateSiteSettings();
  await migrateProducts();
  await migrateOrders();
  console.log("\nГотово. Данные перенесены на Timeweb Postgres.");
  await pool.end();
}

main().catch((error) => {
  console.error("Миграция прервана с ошибкой:", error);
  process.exit(1);
});
