"use client";

import { useState } from "react";
import Link from "next/link";
import { ProductCard } from "./product-card";
import { Button } from "./button";
import { useCatalogData } from "@/lib/catalog-data-context";
import { useSiteSettings } from "@/lib/site-settings-context";

const PAGE_SIZE = 8;

export function FeaturedProducts() {
  const { products: allProducts, loading } = useCatalogData();
  const { settings } = useSiteSettings();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const allHits = allProducts.filter((product) => product.isHit && product.inStock);
  const products = allHits.slice(0, visibleCount);

  if (!loading && products.length === 0) return null;

  return (
    <section className="bg-sand-50 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold text-brand-900 sm:text-3xl">
              Хиты {settings.name}
            </h2>
            <p className="mt-2 text-sm text-zinc-500 sm:text-base">
              Самые популярные товары у наших покупателей
            </p>
          </div>
          <Link
            href="/catalog"
            className="hidden shrink-0 text-sm font-medium text-accent-600 hover:text-accent-700 sm:block"
          >
            Весь каталог →
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {visibleCount < allHits.length && (
          <div className="mt-10 flex justify-center">
            <Button variant="outline-dark" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>
              Показать ещё
            </Button>
          </div>
        )}

        <div className="mt-6 flex justify-center">
          <Button href="/catalog" variant="accent">
            Перейти в каталог
          </Button>
        </div>
      </div>
    </section>
  );
}
