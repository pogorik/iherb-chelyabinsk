import { pool } from "@/lib/db";
import { sendTelegramMessage } from "@/lib/telegram";

// Telegram шлёт сюда апдейты бота. Все, кто написал боту (обычно /start),
// подписываются на уведомления о заказах; /stop — отписка.
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // Проверяем, что запрос действительно от Telegram (секрет задаётся при
  // setWebhook и приходит в этом заголовке).
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret && request.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return new Response("forbidden", { status: 401 });
  }

  let update: {
    message?: {
      text?: string;
      chat?: { id?: number; username?: string; first_name?: string };
    };
  };
  try {
    update = await request.json();
  } catch {
    return new Response("ok"); // не JSON — просто игнорируем
  }

  const msg = update.message;
  const chat = msg?.chat;
  if (!chat?.id) return new Response("ok");

  const text = (msg?.text || "").trim();

  try {
    if (text.toLowerCase().startsWith("/stop")) {
      await pool.query("delete from telegram_subscribers where chat_id = $1", [chat.id]);
      await sendTelegramMessage(chat.id, "Вы отписались от уведомлений о заказах. Напишите /start, чтобы подписаться снова.");
    } else {
      const isNew = await pool.query(
        `insert into telegram_subscribers (chat_id, username, first_name)
         values ($1, $2, $3)
         on conflict (chat_id) do update set username = excluded.username, first_name = excluded.first_name
         returning (xmax = 0) as inserted`,
        [chat.id, chat.username ?? null, chat.first_name ?? null],
      );
      // Приветствие показываем только при первой подписке или на /start.
      if (isNew.rows[0]?.inserted || text.toLowerCase().startsWith("/start")) {
        await sendTelegramMessage(
          chat.id,
          "✅ Готово! Вы будете получать уведомления о новых заказах с сайта.\n\nЧтобы отписаться — отправьте /stop.",
        );
      }
    }
  } catch (err) {
    console.error("Ошибка обработки Telegram-вебхука:", err);
  }

  return new Response("ok");
}
