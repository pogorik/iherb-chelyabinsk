// Разовое создание/обновление пароля учётной записи админки на Timeweb Postgres.
// Запуск: npx tsx scripts/create-admin-user.ts you@example.com "пароль"
// Требует DATABASE_URL в .env.local.

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

import bcrypt from "bcryptjs";
import { Pool } from "pg";

const [, , email, password] = process.argv;

if (!email || !password) {
  console.error('Использование: npx tsx scripts/create-admin-user.ts you@example.com "пароль"');
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("Не задан DATABASE_URL в .env.local.");
  process.exit(1);
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const passwordHash = await bcrypt.hash(password, 12);

  await pool.query(
    `insert into admin_users (email, password_hash)
     values ($1, $2)
     on conflict (email) do update set password_hash = excluded.password_hash`,
    [email, passwordHash]
  );

  console.log(`✓ Учётная запись готова: ${email}`);
  await pool.end();
}

main().catch((error) => {
  console.error("Не удалось создать пользователя:", error);
  process.exit(1);
});
