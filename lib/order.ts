import { siteConfig } from "./config";
import { formatPrice } from "./utils";
import type { Product } from "./types";

export interface OrderLine {
  product: Product;
  qty: number;
  lineTotal: number;
}

export interface CustomerInfo {
  name: string;
  phone: string;
  fulfillment?: string;
  comment?: string;
}

// Формирует текст заявки. Пока заявка уходит менеджеру через WhatsApp-ссылку
// (без бэкенда), позже сюда можно подключить отправку в CRM/Telegram-бота.
export function buildOrderMessage(
  lines: OrderLine[],
  totalPrice: number,
  customer: CustomerInfo,
  shopName: string = siteConfig.name
): string {
  const itemsText = lines
    .map(
      (line, index) =>
        `${index + 1}. ${line.product.name} (${line.product.volume}) × ${line.qty} — ${formatPrice(
          line.lineTotal
        )}`
    )
    .join("\n");

  return [
    `Здравствуйте! Хочу оформить заказ в ${shopName}:`,
    "",
    itemsText,
    "",
    `Итого: ${formatPrice(totalPrice)}`,
    "",
    `Имя: ${customer.name}`,
    `Телефон: ${customer.phone}`,
    customer.fulfillment ? `Способ получения: ${customer.fulfillment}` : null,
    customer.comment ? `Комментарий: ${customer.comment}` : null,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

export function buildWhatsAppLink(
  message: string,
  whatsappNumber: string = siteConfig.whatsappNumber
): string {
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}
