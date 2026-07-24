// Одноразовый перенос текущих демо-данных (lib/products.ts, lib/config.ts) в Supabase.
// Запуск: npx tsx scripts/seed.ts
// Требует SUPABASE_SERVICE_ROLE_KEY в .env.local (обходит RLS, никогда не коммитить).

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { PRODUCTS, ACTIVE_COMPONENTS, PURPOSES, BRANDS } from "../lib/products";
import { siteConfig } from "../lib/config";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Не заданы NEXT_PUBLIC_SUPABASE_URL и/или SUPABASE_SERVICE_ROLE_KEY в .env.local — смотрите .env.local.example."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function seedPurposes() {
  const { error } = await supabase.from("purposes").upsert(PURPOSES, { onConflict: "slug" });
  if (error) throw error;
  console.log(`✓ purposes: ${PURPOSES.length}`);
}

async function seedBrands() {
  const { error } = await supabase.from("brands").upsert(BRANDS, { onConflict: "slug" });
  if (error) throw error;
  console.log(`✓ brands: ${BRANDS.length}`);
}

async function seedActiveComponents() {
  const { error } = await supabase
    .from("active_components")
    .upsert(ACTIVE_COMPONENTS, { onConflict: "slug" });
  if (error) throw error;
  console.log(`✓ active_components: ${ACTIVE_COMPONENTS.length}`);
}

async function seedProducts() {
  const rows = PRODUCTS.map((product) => ({
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    price: product.price,
    old_price: product.oldPrice ?? null,
    age_group: product.ageGroup,
    purposes: product.purposes,
    active_components: product.activeComponents,
    form: product.form,
    volume: product.volume,
    description: product.description,
    rating: product.rating,
    reviews_count: product.reviewsCount,
    in_stock: product.inStock,
    stock_quantity: product.inStock ? 25 : 0,
    is_hit: product.isHit ?? false,
    accent: product.accent,
  }));
  const { error } = await supabase.from("products").upsert(rows, { onConflict: "slug" });
  if (error) throw error;
  console.log(`✓ products: ${rows.length}`);
}

async function seedSiteSettings() {
  const { error } = await supabase.from("site_settings").upsert(
    {
      id: 1,
      name: siteConfig.name,
      tagline: siteConfig.tagline,
      hero_title: `Добро пожаловать\nв ${siteConfig.name}!`,
      hero_subtitle:
        "Витамины, минералы и БАДы для иммунитета, энергии и красоты — с удобным подбором по назначению и активному компоненту.",
      phone: siteConfig.phone,
      phone_href: siteConfig.phoneHref,
      whatsapp_number: siteConfig.whatsappNumber,
      telegram_username: siteConfig.telegramUsername,
      max_href: siteConfig.maxHref,
      email: siteConfig.email,
      address: siteConfig.address,
      working_hours: siteConfig.workingHours,
      vk_url: siteConfig.vkUrl,
      pickup_info: siteConfig.pickupInfo,
    },
    { onConflict: "id" }
  );
  if (error) throw error;
  console.log("✓ site_settings: 1 запись");
}

async function main() {
  await seedPurposes();
  await seedBrands();
  await seedActiveComponents();
  await seedProducts();
  await seedSiteSettings();
  console.log("\nГотово. Данные перенесены в Supabase.");
}

main().catch((error) => {
  console.error("Сидирование прервано с ошибкой:", error);
  process.exit(1);
});
