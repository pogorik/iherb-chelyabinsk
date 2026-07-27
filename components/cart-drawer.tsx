"use client";

import { useState, type FormEvent } from "react";
import { CartIcon, CheckIcon, CloseIcon, MaxIcon, TelegramIcon, VkIcon, WhatsAppIcon } from "./icons";
import { QuantityStepper } from "./quantity-stepper";
import { ProductImage } from "./product-image";
import { Button } from "./button";
import { useCart } from "@/lib/cart-context";
import { useSiteSettings } from "@/lib/site-settings-context";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/utils";
import { buildOrderMessage, buildWhatsAppLink, buildTelegramLink } from "@/lib/order";
import { FULFILLMENT_OPTIONS } from "@/lib/fulfillment";

type Step = "cart" | "checkout" | "done";

export function CartDrawer() {
  const { isOpen, closeCart, lines, totalPrice, totalCount, updateQty, removeItem, clear } = useCart();
  const { settings } = useSiteSettings();
  const [step, setStep] = useState<Step>("cart");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [fulfillment, setFulfillment] = useState(FULFILLMENT_OPTIONS[0]);
  const [comment, setComment] = useState("");
  const [consent, setConsent] = useState(false);
  const [orderText, setOrderText] = useState("");
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);

  function handleClose() {
    closeCart();
    window.setTimeout(() => setStep("cart"), 200);
  }

  async function handleSubmitOrder(event: FormEvent) {
    event.preventDefault();
    if (!consent) return;
    setSubmitting(true);
    setStockError(null);

    // Финальная проверка остатков перед отправкой — то, что лежит в корзине,
    // могло устареть (товар добавили давно или его раскупили в другой вкладке).
    try {
      const { data: stockRows } = await supabase
        .from("products")
        .select("id, name, stock_quantity")
        .in(
          "id",
          lines.map((line) => line.product.id)
        );

      const shortages = lines
        .map((line) => {
          const fresh = stockRows?.find((row) => row.id === line.product.id);
          const available = fresh ? fresh.stock_quantity : line.product.stockQuantity;
          if (typeof available === "number" && line.qty > available) {
            return { name: line.product.name, available };
          }
          return null;
        })
        .filter((item): item is { name: string; available: number } => item !== null);

      if (shortages.length > 0) {
        setStockError(
          shortages
            .map((item) =>
              item.available > 0
                ? `«${item.name}» — в наличии только ${item.available} шт., уменьшите количество в корзине`
                : `«${item.name}» — закончился, уберите из корзины`
            )
            .join("; ")
        );
        setSubmitting(false);
        return;
      }
    } catch (error) {
      // Если проверка не удалась (нет сети) — не блокируем оформление,
      // это best-effort защита, а не единственная линия обороны.
      console.error("Не удалось проверить остатки", error);
    }

    const customer = { name, phone, fulfillment, comment };
    setOrderText(buildOrderMessage(lines, totalPrice, customer, settings.name));

    try {
      await supabase.from("orders").insert({
        customer_name: name,
        customer_phone: phone,
        fulfillment,
        customer_comment: comment || null,
        items: lines.map((line) => ({
          product_id: line.product.id,
          name: line.product.name,
          qty: line.qty,
          price: line.product.price,
          line_total: line.lineTotal,
        })),
        total_price: totalPrice,
      });
    } catch (error) {
      // Best-effort: если запись в базу не удалась (нет сети и т.п.),
      // клиента это не должно блокировать — заявка всё равно уйдёт в WhatsApp.
      console.error("Не удалось сохранить заказ в базу", error);
    }

    setSubmitting(false);
    setStep("done");
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(orderText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard access unavailable — silently ignore
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-brand-950/50 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="flex h-full w-full max-w-md flex-col rounded-l-[28px] border-l border-line bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line p-4">
          <p className="text-base font-semibold text-brand-900">
            {step === "cart" && `Корзина (${totalCount})`}
            {step === "checkout" && "Оформление заявки"}
            {step === "done" && "Заявка готова"}
          </p>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full p-1.5 text-zinc-500 transition hover:bg-zinc-100"
            aria-label="Закрыть"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {step === "cart" && (
          <>
            <div className="flex-1 overflow-y-auto p-4">
              {lines.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center text-sm text-zinc-500">
                  <CartIcon className="mb-3 h-10 w-10 text-zinc-300" />
                  <p>Корзина пока пуста</p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {lines.map((line) => (
                    <li key={line.product.id} className="flex gap-3">
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-sand-100">
                        <ProductImage product={line.product} className="h-full w-full" glyphClassName="p-3" />
                      </div>
                      <div className="flex flex-1 flex-col">
                        <p className="line-clamp-2 text-sm font-medium text-brand-900">
                          {line.product.name}
                        </p>
                        <p className="text-xs text-zinc-500">{line.product.volume}</p>
                        <div className="mt-auto flex items-center justify-between pt-2">
                          <QuantityStepper
                            size="sm"
                            value={line.qty}
                            max={line.product.stockQuantity}
                            onChange={(value) => updateQty(line.product.id, value)}
                          />
                          <p className="text-sm font-semibold text-brand-900">
                            {formatPrice(line.lineTotal)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(line.product.id)}
                        className="self-start text-zinc-400 transition hover:text-accent-500"
                        aria-label="Удалить товар"
                      >
                        <CloseIcon className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {lines.length > 0 && (
              <div className="border-t border-line p-4">
                <div className="flex items-center justify-between pb-3 text-sm">
                  <span className="text-zinc-500">Итого</span>
                  <span className="text-lg font-semibold text-brand-900">{formatPrice(totalPrice)}</span>
                </div>
                <Button variant="accent" size="lg" fullWidth onClick={() => setStep("checkout")}>
                  Оформить заказ
                </Button>
              </div>
            )}
          </>
        )}

        {step === "checkout" && (
          <form onSubmit={handleSubmitOrder} className="flex flex-1 flex-col p-4">
            <p className="text-sm text-zinc-500">
              Оставьте контакты — мы соберём сообщение с заказом, и вы сразу сможете отправить его
              нам в WhatsApp, Telegram, MAX или ВКонтакте.
            </p>
            <div className="mt-4 space-y-3">
              <label className="block text-sm">
                <span className="mb-1 block text-zinc-600">Имя</span>
                <input
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand-400"
                  placeholder="Как к вам обращаться"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-zinc-600">Телефон</span>
                <input
                  required
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand-400"
                  placeholder="+7 900 000-00-00"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-zinc-600">Способ получения</span>
                <select
                  value={fulfillment}
                  onChange={(event) => setFulfillment(event.target.value)}
                  className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand-400"
                >
                  {FULFILLMENT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-zinc-600">Комментарий (необязательно)</span>
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand-400"
                  placeholder="Например, удобное время для звонка"
                />
              </label>
            </div>

            {stockError && (
              <p className="mt-3 rounded-xl bg-accent-50 p-3 text-sm text-accent-700">{stockError}</p>
            )}

            <label className="mt-auto flex items-start gap-2.5 pt-4 text-xs text-zinc-500">
              <input
                required
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-line text-accent-600 focus:ring-accent-400"
              />
              <span>
                Я согласен на обработку персональных данных в соответствии с{" "}
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-600 underline hover:text-accent-700"
                >
                  Политикой обработки персональных данных
                </a>
              </span>
            </label>

            <div className="mt-4 flex gap-2">
              <Button
                variant="outline-dark"
                size="lg"
                className="flex-1"
                onClick={() => setStep("cart")}
              >
                Назад
              </Button>
              <Button
                variant="accent"
                size="lg"
                type="submit"
                disabled={submitting || !consent}
                className="flex-1"
              >
                {submitting ? "Отправляем…" : "Сформировать заявку"}
              </Button>
            </div>
          </form>
        )}

        {step === "done" && (
          <div className="flex flex-1 flex-col p-4">
            <div className="flex items-center gap-2 rounded-xl bg-brand-50 p-3 text-sm text-brand-700">
              <CheckIcon className="h-4 w-4 shrink-0" />
              Сообщение с заказом готово. Выберите, куда его отправить — менеджер свяжется с вами
              для подтверждения.
            </div>
            <pre className="mt-4 flex-1 overflow-y-auto whitespace-pre-wrap rounded-xl bg-sand-50 p-3 text-xs leading-relaxed text-zinc-700">
              {orderText}
            </pre>
            <div className="mt-4 space-y-2">
              <a
                href={buildWhatsAppLink(orderText, settings.whatsappNumber)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => clear()}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] py-3 text-sm font-medium text-white transition hover:brightness-95"
              >
                <WhatsAppIcon className="h-4 w-4" />
                Отправить в WhatsApp
              </a>
              <a
                href={buildTelegramLink(orderText, settings.telegramUsername)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => clear()}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#229ED9] py-3 text-sm font-medium text-white transition hover:brightness-95"
              >
                <TelegramIcon className="h-4 w-4" />
                Отправить в Telegram
              </a>
              <a
                href={settings.maxHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  // MAX не поддерживает диплинк с готовым текстом на конкретного
                  // контакта — копируем текст в буфер, чтобы его оставалось
                  // только вставить в открывшемся чате.
                  handleCopy();
                  clear();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-900 py-3 text-sm font-medium text-white transition hover:brightness-110"
              >
                <MaxIcon className="h-4 w-4" />
                Написать в MAX (текст скопируется)
              </a>
              <a
                href={settings.vkUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  // ВК тоже не поддерживает предзаполнение видимого текста
                  // сообщения по ссылке — копируем в буфер, как и для MAX.
                  handleCopy();
                  clear();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#0077FF] py-3 text-sm font-medium text-white transition hover:brightness-95"
              >
                <VkIcon className="h-4 w-4" />
                Написать во ВКонтакте (текст скопируется)
              </a>
              <Button variant="outline-dark" size="lg" fullWidth onClick={handleCopy}>
                {copied ? "Скопировано" : "Скопировать текст заявки"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
