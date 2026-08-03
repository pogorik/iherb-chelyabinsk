"use client";

import { useEffect, useState } from "react";
import { CartIcon, CheckIcon, CloseIcon, LinkIcon } from "./icons";
import { ProductImage } from "./product-image";
import { QuantityStepper } from "./quantity-stepper";
import { Button } from "./button";
import { useQuickView } from "@/lib/quickview-context";
import { useCart } from "@/lib/cart-context";
import { siteConfig } from "@/lib/config";
import { formatPrice } from "@/lib/utils";
import { ACTIVE_COMPONENTS, FORM_LABELS } from "@/lib/products";
import { useCatalogData } from "@/lib/catalog-data-context";

export function QuickViewModal() {
  const { product, close } = useQuickView();
  const { addItem } = useCart();
  const { purposes } = useCatalogData();
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [linkCopied, setLinkCopied] = useState(false);

  // Каждый раз, когда через быстрый просмотр открывают другой товар,
  // галерея должна вернуться к первому фото, а не остаться на прошлом индексе.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- сброс состояния при смене товара, не побочный эффект рендера
    setActiveImage(0);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- сброс состояния при смене товара, не побочный эффект рендера
    setLinkCopied(false);
  }, [product?.id]);

  if (!product) return null;

  async function handleCopyLink() {
    if (!product) return;
    const url = `${siteConfig.siteUrl}/catalog?product=${product.slug}`;
    await navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 1500);
  }

  const photos = product.imageUrls ?? [];

  const purposeLabels = product.purposes
    .map((slug) => purposes.find((p) => p.slug === slug)?.label)
    .filter((label): label is string => Boolean(label));
  const componentLabels = product.activeComponents
    .map((slug) => ACTIVE_COMPONENTS.find((c) => c.slug === slug)?.label)
    .filter((label): label is string => Boolean(label));

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-brand-950/50 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={close}
    >
      <div
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-[28px] border border-line bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)] sm:rounded-[28px]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line p-4">
          <p className="text-sm font-medium text-brand-900">Быстрый просмотр</p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium text-zinc-500 transition hover:bg-zinc-100"
              aria-label="Скопировать ссылку на товар"
            >
              {linkCopied ? (
                <>
                  <CheckIcon className="h-4 w-4" /> Скопировано
                </>
              ) : (
                <>
                  <LinkIcon className="h-4 w-4" /> Ссылка
                </>
              )}
            </button>
            <button
              type="button"
              onClick={close}
              className="rounded-full p-1.5 text-zinc-500 transition hover:bg-zinc-100"
              aria-label="Закрыть"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid gap-6 p-5 sm:grid-cols-2 sm:p-6">
          <div>
            <div className="aspect-square overflow-hidden rounded-2xl bg-sand-100">
              {photos.length > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element -- static export + Supabase Storage host
                <img
                  src={photos[activeImage] ?? photos[0]}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <ProductImage product={product} className="h-full w-full" glyphClassName="p-10" />
              )}
            </div>
            {photos.length > 1 && (
              <div className="mt-2 flex gap-2">
                {photos.map((photo, index) => (
                  <button
                    key={photo}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    className={`h-14 w-14 shrink-0 overflow-hidden rounded-xl border bg-sand-100 transition ${
                      index === activeImage ? "border-accent-500" : "border-line hover:border-brand-300"
                    }`}
                    aria-label={`Фото ${index + 1}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- static export + Supabase Storage host */}
                    <img src={photo} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <p className="text-xs text-zinc-500">{product.brand}</p>
            <h3 className="mt-1 font-display text-xl font-semibold text-brand-900">{product.name}</h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">{product.description}</p>

            <dl className="mt-4 grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-zinc-500">Форма</dt>
              <dd className="text-brand-900">{FORM_LABELS[product.form]}</dd>
              <dt className="text-zinc-500">Объём</dt>
              <dd className="text-brand-900">{product.volume}</dd>
            </dl>

            {(purposeLabels.length > 0 || componentLabels.length > 0) && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {purposeLabels.map((label) => (
                  <span key={label} className="rounded-full bg-brand-50 px-2.5 py-1 text-xs text-brand-700">
                    {label}
                  </span>
                ))}
                {componentLabels.map((label) => (
                  <span key={label} className="rounded-full bg-sand-100 px-2.5 py-1 text-xs text-zinc-600">
                    {label}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-auto flex items-center justify-between gap-3 pt-6">
              <div>
                <p className="text-2xl font-semibold text-brand-900">{formatPrice(product.price)}</p>
                {product.oldPrice && (
                  <p className="text-sm text-zinc-400 line-through">{formatPrice(product.oldPrice)}</p>
                )}
              </div>
              <QuantityStepper value={qty} onChange={setQty} max={product.stockQuantity} />
            </div>

            <Button
              variant="accent"
              size="lg"
              fullWidth
              disabled={!product.inStock}
              onClick={() => {
                addItem(product.id, qty);
                close();
              }}
              className="mt-4"
            >
              <CartIcon className="h-4 w-4" />
              {product.inStock ? "Добавить в корзину" : "Нет в наличии"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
