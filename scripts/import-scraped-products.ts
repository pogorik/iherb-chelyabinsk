// Одноразовый импорт реальных товаров из двух скрейпов (inblossom, nutricionica)
// в Supabase, с заменой демо-данных и сжатием фото в WebP.
// Запуск: npx tsx scripts/import-scraped-products.ts
// Требует SUPABASE_SERVICE_ROLE_KEY в .env.local (обходит RLS, никогда не коммитить).

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import sharp from "sharp";

const isDryRun = process.argv.includes("--dry-run");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!isDryRun && (!supabaseUrl || !serviceRoleKey)) {
  console.error("Не заданы NEXT_PUBLIC_SUPABASE_URL и/или SUPABASE_SERVICE_ROLE_KEY в .env.local.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl ?? "https://placeholder.supabase.co", serviceRoleKey ?? "placeholder");

const SOURCE_ROOT = "C:\\Users\\Ivan\\Desktop\\товары";
const INBLOSSOM_DIR = path.win32.join(SOURCE_ROOT, "output");
const INBLOSSOM_XLSX = path.win32.join(INBLOSSOM_DIR, "inblossom_iherb_brands.xlsx");
const NUTRI_DIR = path.win32.join(SOURCE_ROOT, "output_nutricionica");
const NUTRI_XLSX = path.win32.join(NUTRI_DIR, "nutricionica_iherb_brands.xlsx");

interface ProductRow {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  old_price: number | null;
  age_group: "adult" | "kids";
  purposes: string[];
  active_components: string[];
  form: "capsules" | "tablets" | "powder" | "liquid" | "gummies";
  volume: string;
  description: string;
  rating: number;
  reviews_count: number;
  in_stock: boolean;
  stock_quantity: number;
  is_hit: boolean;
  accent: "accent";
  image_url: string | null;
  __imagePath: string | null; // локальный путь к исходному фото, не идёт в БД
}

// ---------- Справочники маппинга ----------

const PURPOSE_MAP: Record<string, string> = {
  "Anti-age и долголетие": "anti-age",
  "Анемия": "vitamins-minerals",
  "Антиоксиданты": "anti-age",
  "Беременность": "womens-health",
  "Гормональная система": "vitamins-minerals",
  "Детокс": "detox-liver",
  "ЖКТ": "gut-health",
  "Железо": "vitamins-minerals",
  "Женское здоровье": "womens-health",
  "Зрение": "eyesight",
  "Иммунитет": "immunity",
  "Имуномодуляторы": "immunity",
  "Кожа": "beauty-skin",
  "Легкие и кашель": "immunity",
  "Мужское здоровье": "mens-health",
  "Нервная система": "sleep-nervous",
  "Память и внимание": "sleep-nervous",
  "Печень и желчный": "detox-liver",
  "Пищеварение": "gut-health",
  "Противовирусные": "immunity",
  "Противопаразитарные": "gut-health",
  "Работа мозга": "sleep-nervous",
  "Сад и школа": "kids-health",
  "Сердце и сосуды": "heart-vessels",
  "Снижение веса": "sport-energy",
  "Сон": "sleep-nervous",
  "Суставы и кости": "joints-bones",
  "Ухо": "immunity",
  "Щитовидная железа": "vitamins-minerals",
  "Энергия и работоспособность": "sport-energy",
  "волосы": "beauty-skin",
  "горло": "immunity",
  "ногти": "beauty-skin",
  "нос": "immunity",
};

const COMPONENT_MAP: Record<string, { slug: string; label: string }> = {
  "Адаптогены": { slug: "adaptogens", label: "Адаптогены" },
  "Аминокислоты": { slug: "amino-acids", label: "Аминокислоты" },
  "Антиоксиданты": { slug: "antioxidants", label: "Антиоксиданты" },
  "Артишок": { slug: "artichoke", label: "Артишок" },
  "Берберин": { slug: "berberine", label: "Берберин" },
  "Босвеллия": { slug: "boswellia", label: "Босвеллия" },
  "Валериана": { slug: "valerian", label: "Валериана" },
  "Витамин D": { slug: "vitamin-d", label: "Витамин D" },
  "Витамин А": { slug: "vitamin-a", label: "Витамин А" },
  "Витамин В": { slug: "vitamin-b", label: "Витамин B" },
  "Витамин Е": { slug: "vitamin-e", label: "Витамин Е" },
  "Витамин К": { slug: "vitamin-k", label: "Витамин К" },
  "Витамин С": { slug: "vitamin-c", label: "Витамин C" },
  "ГАМК": { slug: "gaba", label: "ГАМК" },
  "Гиалуроновая кислота": { slug: "hyaluronic-acid", label: "Гиалуроновая кислота" },
  "Железо": { slug: "iron", label: "Железо" },
  "Имуномодуляторы": { slug: "immunomodulators", label: "Иммуномодуляторы" },
  "Инозитол": { slug: "inositol", label: "Инозитол" },
  "Йод": { slug: "iodine", label: "Йод" },
  "Кальций": { slug: "calcium", label: "Кальций" },
  "Кверцетин": { slug: "quercetin", label: "Кверцетин" },
  "Коллаген": { slug: "collagen", label: "Коллаген" },
  "Куркумин": { slug: "curcumin", label: "Куркумин" },
  "Лецитин": { slug: "lecithin", label: "Лецитин" },
  "Лютеин": { slug: "lutein", label: "Лютеин" },
  "Магний": { slug: "magnesium", label: "Магний" },
  "Мелатонин": { slug: "melatonin", label: "Мелатонин" },
  "Молозиво": { slug: "colostrum", label: "Молозиво" },
  "Мультикомплекс": { slug: "multi-complex", label: "Мультикомплекс" },
  "Омега 3": { slug: "omega-3", label: "Омега-3" },
  "Примула вечерняя": { slug: "evening-primrose", label: "Примула вечерняя" },
  "Пробиотики": { slug: "probiotics", label: "Пробиотики" },
  "Ресвератрол": { slug: "resveratrol", label: "Ресвератрол" },
  "Силимарин": { slug: "silymarin", label: "Силимарин" },
  "Сорбенты": { slug: "sorbents", label: "Сорбенты" },
  "Ферменты": { slug: "enzymes", label: "Ферменты" },
  "Хлорофилл": { slug: "chlorophyll", label: "Хлорофилл" },
  "Хондроитин и глюкозамин": { slug: "glucosamine-chondroitin", label: "Хондроитин и глюкозамин" },
  "Цинк": { slug: "zinc", label: "Цинк" },
  "Эхинацея и бузина": { slug: "echinacea-elderberry", label: "Эхинацея и бузина" },
  "медь": { slug: "copper", label: "Медь" },
  "селен": { slug: "selenium", label: "Селен" },
};

const NUTRI_KEYWORD_RULES: Array<[RegExp, string]> = [
  [/иммун|вирус|простуд|орви|грипп/i, "immunity"],
  [/бессонниц|мелатонин/i, "sleep-nervous"],
  [/стресс|нерв|тревож|успокои|\bсон\b/i, "sleep-nervous"],
  [/сустав|кост|хрящ|хондроитин|глюкозамин/i, "joints-bones"],
  [/кожа|волос|ногт|коллаген/i, "beauty-skin"],
  [/жкт|пищевар|кишечник|желудк|пробиотик/i, "gut-health"],
  [/сердц|сосуд|холестерин/i, "heart-vessels"],
  [/энерг|спорт|мышц|тренир|выносливост/i, "sport-energy"],
  [/печен|детокс|очищени/i, "detox-liver"],
  [/женск|беременност/i, "womens-health"],
  [/мужск|простат/i, "mens-health"],
  [/зрение|глаз/i, "eyesight"],
  [/anti-age|антивозраст|старени|долголети|антиоксидант/i, "anti-age"],
  [/детск|для детей|ребён|ребен|kids|child/i, "kids-health"],
];

const STOCK_TIER_MAP: Record<string, number> = {
  "Много": 50,
  "Достаточно": 20,
  "Мало": 5,
  "Нет в наличии": 0,
};

// ---------- Хелперы ----------

function slugifyBrand(brand: string): string {
  return brand
    .trim()
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function inferAgeGroup(name: string, brand: string): "adult" | "kids" {
  return /детск|zoo friends|childlife|kids/i.test(`${name} ${brand}`) ? "kids" : "adult";
}

function inferForm(name: string): ProductRow["form"] {
  const s = name.toLowerCase();
  if (/мармелад|gummy|gummies/.test(s)) return "gummies";
  if (/порошок|powder/.test(s)) return "powder";
  if (/жидк|сироп|капли|liquid/.test(s)) return "liquid";
  if (/таблет/.test(s)) return "tablets";
  return "capsules";
}

function extractVolume(name: string): string {
  const parts = name.split(",").map((p) => p.trim());
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

function mapInblossomPurposes(characteristics: string): string[] {
  const match = characteristics.split(";").find((part) => part.trim().startsWith("Назначение:"));
  if (!match) return ["vitamins-minerals"];
  const raw = match.split(":").slice(1).join(":");
  const slugs = new Set<string>();
  raw.split(",").forEach((tag) => {
    const clean = tag.trim();
    const mapped = PURPOSE_MAP[clean];
    if (mapped) slugs.add(mapped);
  });
  return slugs.size > 0 ? Array.from(slugs) : ["vitamins-minerals"];
}

function mapInblossomComponents(characteristics: string): string[] {
  const match = characteristics.split(";").find((part) => part.trim().startsWith("Активный компонент:"));
  if (!match) return [];
  const raw = match.split(":").slice(1).join(":");
  const slugs = new Set<string>();
  raw.split(",").forEach((tag) => {
    const clean = tag.trim();
    const mapped = COMPONENT_MAP[clean];
    if (mapped) slugs.add(mapped.slug);
  });
  return Array.from(slugs);
}

function mapNutriPurposes(text: string): string[] {
  const slugs = new Set<string>();
  for (const [regex, slug] of NUTRI_KEYWORD_RULES) {
    if (regex.test(text)) slugs.add(slug);
  }
  return slugs.size > 0 ? Array.from(slugs) : ["vitamins-minerals"];
}

function readSheetRows(filePath: string): unknown[][] {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });
  return rows.slice(1); // без заголовка
}

function firstImagePath(baseDir: string, localPathsCell: string): string | null {
  if (!localPathsCell) return null;
  // Имена файлов сами содержат запятые (полное название товара), поэтому
  // разделять несколько путей в ячейке можно только по границе "images\",
  // а не по любой запятой.
  const first = localPathsCell.split(/,\s*(?=images[\\/])/)[0]?.trim();
  if (!first) return null;
  return path.win32.join(baseDir, first);
}

// ---------- Построение товаров ----------

const usedComponentSlugs = new Map<string, string>();
const usedBrands = new Set<string>();
let hitsAssigned = 0;

function buildFromInblossom(row: unknown[]): ProductRow | null {
  const [brandRaw, nameRaw, articul, priceRaw, oldPriceRaw, stockRaw, descRaw, chars, photosCell] =
    row as string[];
  const name = String(nameRaw || "").trim();
  const brand = String(brandRaw || "").trim();
  if (!name || !brand || !articul) return null;

  const characteristics = String(chars || "");
  const components = mapInblossomComponents(characteristics);
  components.forEach((slug) => {
    const entry = Object.values(COMPONENT_MAP).find((c) => c.slug === slug);
    if (entry) usedComponentSlugs.set(entry.slug, entry.label);
  });
  usedBrands.add(brand);

  const stockQuantity = Math.max(0, Math.round(Number(stockRaw) || 0));
  const isHit = stockQuantity > 0 && hitsAssigned < 8;
  if (isHit) hitsAssigned += 1;

  return {
    id: `inb-${articul}`,
    slug: `inb-${articul}`,
    name,
    brand,
    price: Math.round(Number(priceRaw) || 0),
    old_price: oldPriceRaw ? Math.round(Number(oldPriceRaw)) : null,
    age_group: inferAgeGroup(name, brand),
    purposes: mapInblossomPurposes(characteristics),
    active_components: components,
    form: inferForm(name),
    volume: extractVolume(name),
    description: String(descRaw || "").trim(),
    rating: 0,
    reviews_count: 0,
    in_stock: stockQuantity > 0,
    stock_quantity: stockQuantity,
    is_hit: isHit,
    accent: "accent",
    image_url: null,
    __imagePath: firstImagePath(INBLOSSOM_DIR, String(photosCell || "")),
  };
}

function buildFromNutricionica(row: unknown[]): ProductRow | null {
  const [brandRaw, nameRaw, idRaw, priceRaw, availRaw, descRaw, propsRaw, , , photosCell] =
    row as string[];
  const name = String(nameRaw || "").trim();
  const brand = String(brandRaw || "").trim();
  if (!name || !brand || !idRaw) return null;

  usedBrands.add(brand);

  const stockQuantity = STOCK_TIER_MAP[String(availRaw || "").trim()] ?? 0;
  const isHit = stockQuantity > 0 && hitsAssigned < 8;
  if (isHit) hitsAssigned += 1;

  const scanText = `${name} ${descRaw || ""} ${propsRaw || ""}`;

  return {
    id: `nutri-${idRaw}`,
    slug: `nutri-${idRaw}`,
    name,
    brand,
    price: Math.round(Number(priceRaw) || 0),
    old_price: null,
    age_group: inferAgeGroup(name, brand),
    purposes: mapNutriPurposes(scanText),
    active_components: [],
    form: inferForm(name),
    volume: extractVolume(name),
    description: String(descRaw || "").trim(),
    rating: 0,
    reviews_count: 0,
    in_stock: stockQuantity > 0,
    stock_quantity: stockQuantity,
    is_hit: isHit,
    accent: "accent",
    image_url: null,
    __imagePath: firstImagePath(NUTRI_DIR, String(photosCell || "")),
  };
}

// ---------- Фото ----------

async function processAndUploadImage(product: ProductRow): Promise<void> {
  if (!product.__imagePath) return;
  if (!fs.existsSync(product.__imagePath)) {
    console.warn(`  ! фото не найдено: ${product.slug} (${product.__imagePath})`);
    return;
  }
  try {
    const inputBuffer = fs.readFileSync(product.__imagePath);
    const webpBuffer = await sharp(inputBuffer)
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const storagePath = `${product.slug}.webp`;
    const { error } = await supabase.storage
      .from("product-images")
      .upload(storagePath, webpBuffer, { upsert: true, contentType: "image/webp" });

    if (error) {
      console.warn(`  ! не удалось загрузить фото ${product.slug}: ${error.message}`);
      return;
    }

    const { data } = supabase.storage.from("product-images").getPublicUrl(storagePath);
    product.image_url = data.publicUrl;
  } catch (err) {
    console.warn(`  ! ошибка обработки фото ${product.slug}:`, (err as Error).message);
  }
}

async function processImagesWithConcurrency(products: ProductRow[], concurrency = 8): Promise<void> {
  let index = 0;
  let done = 0;
  async function worker() {
    while (index < products.length) {
      const current = products[index];
      index += 1;
      await processAndUploadImage(current);
      done += 1;
      if (done % 25 === 0 || done === products.length) {
        console.log(`  фото: ${done}/${products.length}`);
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
}

// ---------- Запись в БД ----------

async function chunkedUpsert(table: string, rows: Record<string, unknown>[], onConflict: string, size = 50) {
  for (let i = 0; i < rows.length; i += size) {
    const chunk = rows.slice(i, i + size);
    const { error } = await supabase.from(table).upsert(chunk, { onConflict });
    if (error) throw new Error(`upsert ${table} [${i}-${i + chunk.length}]: ${error.message}`);
  }
}

async function main() {
  console.log("Читаю inblossom...");
  const inblossomRows = readSheetRows(INBLOSSOM_XLSX);
  console.log(`  строк: ${inblossomRows.length}`);

  console.log("Читаю nutricionica...");
  const nutriRows = readSheetRows(NUTRI_XLSX);
  console.log(`  строк: ${nutriRows.length}`);

  const products: ProductRow[] = [];
  for (const row of inblossomRows) {
    const p = buildFromInblossom(row);
    if (p) products.push(p);
  }
  for (const row of nutriRows) {
    const p = buildFromNutricionica(row);
    if (p) products.push(p);
  }
  console.log(`Всего товаров к импорту: ${products.length}`);

  const seenSlugs = new Set<string>();
  const deduped = products.filter((p) => {
    if (seenSlugs.has(p.slug)) {
      console.warn(`  ! дубликат slug пропущен: ${p.slug}`);
      return false;
    }
    seenSlugs.add(p.slug);
    return true;
  });

  if (isDryRun) {
    console.log("\n--dry-run: пропускаю фото/запись в БД. Примеры товаров:");
    for (const p of [deduped[0], deduped[1], deduped[150], deduped[320], deduped[deduped.length - 1]]) {
      if (!p) continue;
      console.log(JSON.stringify({ ...p, description: p.description.slice(0, 40) + "…" }, null, 1));
    }
    const purposeCounts = new Map<string, number>();
    for (const p of deduped) for (const slug of p.purposes) purposeCounts.set(slug, (purposeCounts.get(slug) ?? 0) + 1);
    console.log("\nРаспределение по назначениям:", Object.fromEntries(purposeCounts));
    console.log("Брендов:", usedBrands.size);
    console.log("Активных компонентов (используются в товарах):", usedComponentSlugs.size);
    console.log("Хитов отмечено:", deduped.filter((p) => p.is_hit).length);
    console.log("Товаров с фото (по пути на диске):", deduped.filter((p) => p.__imagePath).length);
    return;
  }

  console.log("Обрабатываю и загружаю фото...");
  await processImagesWithConcurrency(deduped);

  console.log("Удаляю демо-данные (products, brands)...");
  {
    const { error } = await supabase.from("products").delete().neq("id", "__none__");
    if (error) throw new Error(`delete products: ${error.message}`);
  }
  {
    const { error } = await supabase.from("brands").delete().neq("slug", "__none__");
    if (error) throw new Error(`delete brands: ${error.message}`);
  }

  console.log("Загружаю бренды...");
  const brandRows = Array.from(usedBrands).map((label) => ({ slug: slugifyBrand(label), label }));
  await chunkedUpsert("brands", brandRows, "slug");
  console.log(`  ✓ brands: ${brandRows.length}`);

  console.log("Загружаю новые активные компоненты...");
  const componentRows = Array.from(usedComponentSlugs.entries()).map(([slug, label]) => ({ slug, label }));
  await chunkedUpsert("active_components", componentRows, "slug");
  console.log(`  ✓ active_components: ${componentRows.length}`);

  console.log("Загружаю товары...");
  const productRows = deduped.map(({ __imagePath, ...rest }) => rest);
  await chunkedUpsert("products", productRows, "slug");
  console.log(`  ✓ products: ${productRows.length}`);

  const withoutPhoto = deduped.filter((p) => !p.image_url).length;
  console.log(`\nГотово. Импортировано ${productRows.length} товаров, ${brandRows.length} брендов.`);
  if (withoutPhoto > 0) {
    console.log(`Без фото осталось: ${withoutPhoto} (показываются с заглушкой-иконкой).`);
  }
}

main().catch((error) => {
  console.error("Импорт прерван с ошибкой:", error);
  process.exit(1);
});
