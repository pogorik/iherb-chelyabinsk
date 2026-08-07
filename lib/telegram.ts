import { formatPrice } from "./utils";

// Уведомление о новом заказе в Telegram. Токен бота и chat_id получателя
// берутся из .env.local (TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID). Если они не
// заданы — функция тихо ничего не делает, а ошибки отправки не роняют заказ.

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

export async function sendTelegramMessage(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return; // не настроено — молча выходим

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      console.error("Telegram sendMessage failed:", res.status, await res.text().catch(() => ""));
    }
  } catch (err) {
    // Не даём ошибке уведомления сломать оформление заказа.
    console.error("Telegram sendMessage error:", err);
  }
}
