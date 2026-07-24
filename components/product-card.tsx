"use client";

import { useState } from "react";
import { ProductImage } from "./product-image";
import { Button } from "./button";
import { CartIcon, HeartIcon } from "./icons";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/lib/cart-context";
import { useQuickView } from "@/lib/quickview-context";
import type { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  const [wishlisted, setWishlisted] = useState(false);
  const { addItem } = useCart();
  const { open } = useQuickView();
  const discountPercent = product.oldPrice
    ? Math.round(100 - (product.price / product.oldPrice) * 100)
    : null;

  return (
    <div className="group flex flex-col rounded-[20px] border border-line bg-white p-3 transition-shadow hover:shadow-[0_16px_40px_rgba(15,44,70,0.1)]">
      <div className="relative">
        <button
          type="button"
          onClick={() => setWishlisted((w) => !w)}
          className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-brand-700 shadow-sm transition hover:text-accent-500"
          aria-label={wishlisted ? "Убрать из избранного" : "В избранное"}
        >
          <HeartIcon className="h-4 w-4" filled={wishlisted} />
        </button>

        <div className="absolute left-2 top-2 z-10 flex flex-col gap-1">
          {product.isHit && (
            <span className="rounded-full bg-brand-900 px-2 py-0.5 text-[11px] font-medium text-white">
              Хит
            </span>
          )}
          {discountPercent && (
            <span className="rounded-full bg-accent-500 px-2 py-0.5 text-[11px] font-medium text-white">
              −{discountPercent}%
            </span>
          )}
          {!product.inStock && (
            <span className="rounded-full bg-zinc-800/85 px-2 py-0.5 text-[11px] font-medium text-white">
              Нет в наличии
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => open(product)}
          className="block aspect-square w-full overflow-hidden rounded-xl bg-sand-100"
        >
          <ProductImage
            product={product}
            className="h-full w-full p-7 transition-transform duration-300 group-hover:scale-105"
          />
        </button>
      </div>

      <div className="mt-3 flex flex-1 flex-col">
        <p className="text-xs text-zinc-500">{product.brand}</p>
        <button
          type="button"
          onClick={() => open(product)}
          className="mt-0.5 line-clamp-2 text-left text-sm font-medium text-brand-900 hover:text-brand-600"
        >
          {product.name}
        </button>

        <div className="mt-auto space-y-2 pt-3">
          <div className="flex items-baseline gap-2">
            <p className="text-base font-semibold text-brand-900">{formatPrice(product.price)}</p>
            {product.oldPrice && (
              <p className="text-xs text-zinc-400 line-through">{formatPrice(product.oldPrice)}</p>
            )}
          </div>
          <Button
            variant="accent"
            size="sm"
            fullWidth
            disabled={!product.inStock}
            onClick={() => addItem(product.id)}
            className="!h-auto py-2"
          >
            <CartIcon className="h-4 w-4" />
            {product.inStock ? "В корзину" : "Нет в наличии"}
          </Button>
        </div>
      </div>
    </div>
  );
}
