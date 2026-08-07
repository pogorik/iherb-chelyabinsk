import { pool } from "./db";
import { formatPrice } from "./utils";

// Уведомления о новых заказах в Telegram. Подписчики — все, кто написал боту
// /start (см. app/api/telegram/webhook). Их chat_id хранятся в таблице
// telegram_subscribers. Токен бота — в .env.local (TELEGRAM_BOT_TOKEN).
// Если токена нет — функции тихо ничего не делают, ошибки не роняют заказ.

interface OrderItem {
  name?: string;
  qty?: number;
  line_total?: number;
}

interface OrderRow {
  id?: string | number;
  customer_name?: string;
  customer_phone?: string;
  fulfillment?: string | null;
  customer_comment?: string | null;
  items?: OrderItem[];
  total_price?: number;
  created_at?: string;
}

export function buildOrderNotification(order: OrderRow): string {
  const items = Array.isArray(order.items) ? order.items : [];
  const itemsText = items
    .map(
      (it, i) =>
        `${i + 1}. ${it.name ?? "товар"} × ${it.qty ?? 1} — ${formatPrice(it.line_total ?? 0)}`,
    )
    .join("\n");

  return [
    "🛒 Новый заказ на сайте",
    "",
    `👤 ${order.customer_name ?? "—"}`,
    `📞 ${order.customer_phone ?? "—"}`,
    order.fulfillment ? `🚚 ${order.fulfillment}` : null,
    order.customer_comment ? `💬 ${order.customer_comment}` : null,
    "",
    itemsText || "(без позиций)",
    "",
    `💰 Итого: ${formatPrice(order.total_price ?? 0)}`,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

// Отправка одному чату. Возвращает true при успехе. Ошибки не бросает.
export async function sendTelegramMessage(chatId: string | number, text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return false;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    });
    if (!res.ok) {
      console.error("Telegram sendMessage failed:", chatId, res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (err) {
    console.error("Telegram sendMessage error:", chatId, err);
    return false;
  }
}

// Рассылка уведомления о заказе всем подписчикам. Если Telegram считает чат
// недоступным (бот заблокирован/удалён), подписчик убирается из базы.
export async function broadcastOrderNotification(order: OrderRow): Promise<void> {
  if (!process.env.TELEGRAM_BOT_TOKEN) return;

  let chatIds: string[];
  try {
    const { rows } = await pool.query<{ chat_id: string }>(
      "select chat_id from telegram_subscribers",
    );
    chatIds = rows.map((r) => String(r.chat_id));
  } catch (err) {
    console.error("Не удалось прочитать подписчиков Telegram:", err);
    return;
  }

  const text = buildOrderNotification(order);
  await Promise.allSettled(
    chatIds.map(async (chatId) => {
      const ok = await sendTelegramMessage(chatId, text);
      if (!ok) {
        // чат недоступен (например, бот заблокирован) — чистим подписку
        await pool
          .query("delete from telegram_subscribers where chat_id = $1", [chatId])
          .catch(() => {});
      }
    }),
  );
}
