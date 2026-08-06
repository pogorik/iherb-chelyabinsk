// Генерация YML-фида (формат Яндекс.Маркета) для импорта товаров в VK Market.
// VK опрашивает этот фид по расписанию, поэтому он собирается из живой базы —
// цены и наличие всегда актуальны. Подключается в VK: Управление → Товары →
// Расширенные → Импорт товаров → ссылка на прайс-лист (/api/vk.yml).

// Базовый URL магазина. Можно переопределить через env, иначе — боевой домен.
export const VK_SHOP_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://айхерб-74.рф";
const SHOP_NAME = "Айхерб-74";

// Строка товара как отдаёт `select * from products` (snake_case).
export interface ProductRow {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  old_price: number | null;
  purposes: string[] | null;
  form: string;
  volume: string;
  description: string;
  in_stock: boolean;
  image_url: string | null;
  image_urls: string[] | null;
}

// Назначения → категории VK (совпадают с PURPOSES в lib/products.ts).
const PURPOSE_LABELS: Record<string, string> = {
  immunity: "Иммунитет",
  "vitamins-minerals": "Витамины и минералы",
  "gut-health": "ЖКТ и пищеварение",
  "sleep-nervous": "Сон и нервная система",
  "sport-energy": "Спорт и энергия",
  "joints-bones": "Суставы и кости",
  "beauty-skin": "Красота и кожа",
  "heart-vessels": "Сердце и сосуды",
  "detox-liver": "Детокс и печень",
  "womens-health": "Женское здоровье",
  "mens-health": "Мужское здоровье",
  eyesight: "Зрение",
  "anti-age": "Anti-age и долголетие",
  "kids-health": "Детское здоровье",
};

const FORM_LABELS: Record<string, string> = {
  capsules: "Капсулы",
  tablets: "Таблетки",
  powder: "Порошок",
  liquid: "Жидкость",
  gummies: "Пастилки",
};

const MAX_PICTURES = 5; // VK Market показывает до 5 фото на товар.

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// VK запрещает управляющие символы в XML — вырезаем их (кроме \t \n \r).
function clean(value: string): string {
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "").trim();
}

export function buildVkYml(products: ProductRow[]): string {
  const rootId = 1;
  // Категории строим только из назначений, которые реально встречаются.
  const purposeCat = new Map<string, number>();
  let nextCatId = 2;
  for (const p of products) {
    for (const slug of p.purposes || []) {
      if (PURPOSE_LABELS[slug] && !purposeCat.has(slug)) {
        purposeCat.set(slug, nextCatId++);
      }
    }
  }

  const categoriesXml = [
    `    <category id="${rootId}">БАДы и витамины</category>`,
    ...[...purposeCat.entries()].map(
      ([slug, id]) =>
        `    <category id="${id}" parentId="${rootId}">${xmlEscape(PURPOSE_LABELS[slug])}</category>`,
    ),
  ].join("\n");

  const offersXml = products
    .map((p) => {
      const name = clean(p.name);
      const vendor = clean(p.brand);
      // Категория = первое известное назначение, иначе корневая.
      const firstPurpose = (p.purposes || []).find((s) => purposeCat.has(s));
      const categoryId = firstPurpose ? purposeCat.get(firstPurpose)! : rootId;

      const pics = (p.image_urls && p.image_urls.length ? p.image_urls : [p.image_url])
        .filter((u): u is string => !!u)
        .slice(0, MAX_PICTURES);

      const available = p.in_stock ? "true" : "false";
      const lines: string[] = [];
      lines.push(`    <offer id="${xmlEscape(p.id)}" available="${available}">`);
      lines.push(`      <url>${xmlEscape(`${VK_SHOP_URL}/catalog?product=${p.slug}`)}</url>`);
      lines.push(`      <price>${Math.round(p.price)}</price>`);
      if (p.old_price && p.old_price > p.price) {
        lines.push(`      <oldprice>${Math.round(p.old_price)}</oldprice>`);
      }
      lines.push(`      <currencyId>RUB</currencyId>`);
      lines.push(`      <categoryId>${categoryId}</categoryId>`);
      for (const pic of pics) lines.push(`      <picture>${xmlEscape(pic)}</picture>`);
      if (vendor) lines.push(`      <vendor>${xmlEscape(vendor)}</vendor>`);
      lines.push(`      <name>${xmlEscape(name)}</name>`);
      const desc = clean(p.description);
      if (desc) lines.push(`      <description>${xmlEscape(desc)}</description>`);
      if (FORM_LABELS[p.form]) {
        lines.push(`      <param name="Форма выпуска">${xmlEscape(FORM_LABELS[p.form])}</param>`);
      }
      const volume = clean(p.volume);
      if (volume) lines.push(`      <param name="Объём">${xmlEscape(volume)}</param>`);
      lines.push(`    </offer>`);
      return lines.join("\n");
    })
    .join("\n");

  const date = new Date().toISOString().slice(0, 16);
  return `<?xml version="1.0" encoding="UTF-8"?>
<yml_catalog date="${date}">
  <shop>
    <name>${xmlEscape(SHOP_NAME)}</name>
    <company>${xmlEscape(SHOP_NAME)}</company>
    <url>${xmlEscape(VK_SHOP_URL)}</url>
    <currencies>
      <currency id="RUB" rate="1"/>
    </currencies>
    <categories>
${categoriesXml}
    </categories>
    <offers>
${offersXml}
    </offers>
  </shop>
</yml_catalog>
`;
}
