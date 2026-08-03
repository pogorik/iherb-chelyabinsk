import { Pool, types } from "pg";

// pg по умолчанию отдаёт numeric/decimal строками (чтобы не терять точность),
// но весь остальной код (корзина, цены, суммы заказов) ожидает числа, как
// раньше отдавал Supabase/PostgREST. Парсим numeric (OID 1700) как float.
types.setTypeParser(1700, (value: string) => parseFloat(value));

// В dev-режиме Next.js перезагружает модули при каждом изменении файла —
// кэшируем пул на globalThis, чтобы не плодить новые подключения к базе.
declare global {
  var __pgPool: Pool | undefined;
}

function createPool(): Pool {
  try {
    require("fs").appendFileSync(
      "/tmp/db-debug.log",
      `${new Date().toISOString()} createPool called, DATABASE_URL length=${process.env.DATABASE_URL?.length ?? "undefined"}\n`
    );
  } catch {}
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === "false" ? undefined : { rejectUnauthorized: false },
  });
}

export const pool = globalThis.__pgPool ?? createPool();

// Без этого обработчика ошибка на простаивающем соединении в пуле (обрыв
// сети, перезапуск Postgres и т.п.) становится необработанным исключением
// и роняет весь процесс Node — сайт падает целиком вместо одного запроса.
pool.on("error", (err) => {
  console.error("Неожиданная ошибка на простаивающем клиенте Postgres:", err);
});

if (process.env.NODE_ENV !== "production") {
  globalThis.__pgPool = pool;
}
