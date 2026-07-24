import { Suspense } from "react";
import type { Metadata } from "next";
import { CatalogView } from "@/components/catalog-view";

export const metadata: Metadata = {
  title: "Каталог товаров — Iherb Челябинск",
  description: "Витамины и БАДы с фильтрами по назначению, активному компоненту, бренду и цене.",
};

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-16 text-sm text-zinc-400">Загрузка каталога…</div>}>
      <CatalogView />
    </Suspense>
  );
}
