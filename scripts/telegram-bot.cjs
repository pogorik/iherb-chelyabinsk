// Фоновый Telegram-воркер (long-polling). На российском сервере входящие
// вебхуки от Telegram блокируются, а ИСХОДЯЩИЕ запросы к api.telegram.org
// работают — поэтому сервер сам опрашивает getUpdates. Подписывает всех, кто
// написал боту /start (в таблицу telegram_subscribers); /stop — отписка.
// Уведомления о заказах шлёт сам сайт (см. lib/telegram.ts) — тоже исходящими.
//
// Запуск под pm2:  pm2 start scripts/telegram-bot.cjs --name iherb-telegram-bot

const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

// .env.local не подхватывается автоматически вне Next — парсим сами.
const envPath = path.join(__dirname, "..", ".env.local");
for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m && process.env[m[1]] === undefined) {
    process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TOKEN) {
  console.error("TELEGRAM_BOT_TOKEN не задан — воркер выключен");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "false" ? undefined : { rejectUnauthorized: false },
});

async function tg(method, body) {
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  return res.json();
}

const WELCOME =
  "✅ Готово! Вы будете получать уведомления о новых заказах с сайта.\n\nЧтобы отписаться — отправьте /stop.";
const BYE =
  "Вы отписались от уведомлений о заказах. Напишите /start, чтобы подписаться снова.";

async function handleMessage(msg) {
  const chat = msg.chat;
  if (!chat || !chat.id) return;
  const text = (msg.text || "").trim().toLowerCase();

  if (text.startsWith("/stop")) {
    await pool.query("delete from telegram_subscribers where chat_id = $1", [chat.id]);
    await tg("sendMessage", { chat_id: chat.id, text: BYE });
    console.log("отписан:", chat.id);
    return;
  }

  const r = await pool.query(
    `insert into telegram_subscribers (chat_id, username, first_name)
     values ($1, $2, $3)
     on conflict (chat_id) do update set username = excluded.username, first_name = excluded.first_name
     returning (xmax = 0) as inserted`,
    [chat.id, chat.username || null, chat.first_name || null],
  );
  const isNew = r.rows[0] && r.rows[0].inserted;
  if (isNew || text.startsWith("/start")) {
    await tg("sendMessage", { chat_id: chat.id, text: WELCOME });
  }
  if (isNew) console.log("подписан:", chat.id, chat.username || "", chat.first_name || "");
}

async function main() {
  // На всякий случай снимаем вебхук — иначе getUpdates отдаёт 409.
  await tg("deleteWebhook", { drop_pending_updates: false }).catch(() => {});
  console.log("telegram-bot: polling started");

  let offset = 0;
  for (;;) {
    try {
      const j = await tg("getUpdates", { offset, timeout: 30, allowed_updates: ["message"] });
      if (j && j.ok && Array.isArray(j.result)) {
        for (const u of j.result) {
          offset = u.update_id + 1;
          if (u.message) {
            await handleMessage(u.message).catch((e) => console.error("handle:", e.message));
          }
        }
      } else if (j && !j.ok) {
        console.error("getUpdates не ok:", j.description);
        await new Promise((res) => setTimeout(res, 3000));
      }
    } catch (e) {
      console.error("getUpdates ошибка:", e.message);
      await new Promise((res) => setTimeout(res, 3000));
    }
  }
}

main();
