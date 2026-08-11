// Разовая миграция: переписывает ссылки на фото товаров с внешних хранилищ
// (Supabase, Timeweb S3) на локальные (/product-images/, раздаёт nginx).
// Перед правкой сохраняет бэкап колонок в /root/img-rewrite-backup.json.
// Идемпотентна: повторный запуск ничего не портит (трогает только внешние URL).
//
// Запуск на сервере:  node /var/www/iherb/scripts/migrate-images.cjs

const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

// .env.local не подхватывается вне Next — парсим сами.
const envPath = path.join(__dirname, "..", ".env.local");
for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m && process.env[m[1]] === undefined) {
    process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

const SITE = "https://xn---74-5cdfx1a1d1b.xn--p1ai";
const isExternal = (u) => !!u && (u.includes("supabase.co") || u.includes("twcstorage.ru"));
const toLocal = (u) => {
  if (!isExternal(u)) return u;
  const base = u.split("/").pop().split("?")[0];
  return `${SITE}/product-images/${base}`;
};

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "false" ? undefined : { rejectUnauthorized: false },
});

(async () => {
  const { rows } = await pool.query("select id, image_url, image_urls from products");

  const backupPath = "/root/img-rewrite-backup.json";
  fs.writeFileSync(backupPath, JSON.stringify(rows));
  console.log(`Бэкап колонок фото: ${backupPath} (${rows.length} товаров)`);

  let changed = 0;
  for (const r of rows) {
    const newUrl = toLocal(r.image_url);
    const newArr = (r.image_urls || []).map(toLocal);
    const arrChanged = JSON.stringify(newArr) !== JSON.stringify(r.image_urls || []);
    if (newUrl !== r.image_url || arrChanged) {
      await pool.query("update products set image_url = $1, image_urls = $2 where id = $3", [
        newUrl,
        newArr,
        r.id,
      ]);
      changed++;
    }
  }
  console.log(`Товаров обновлено: ${changed}`);

  const left = await pool.query(
    `select count(*)::int n from products
     where image_url like '%supabase%' or image_url like '%twcstorage%'
        or array_to_string(image_urls, ',') like '%supabase%'
        or array_to_string(image_urls, ',') like '%twcstorage%'`,
  );
  console.log(`Осталось товаров с внешними ссылками: ${left.rows[0].n}`);

  const sample = await pool.query("select image_url from products where image_url is not null limit 1");
  console.log(`Пример новой ссылки: ${sample.rows[0] && sample.rows[0].image_url}`);

  await pool.end();
  console.log("Готово.");
})().catch((e) => {
  console.error("ОШИБКА:", e.message);
  process.exit(1);
});
