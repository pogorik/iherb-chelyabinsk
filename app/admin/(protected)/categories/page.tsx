"use client";

import { useCatalogData } from "@/lib/catalog-data-context";
import { TaxonomyEditor } from "@/components/admin/taxonomy-editor";

export default function AdminCategoriesPage() {
  const { purposes, brands, loading, refetch } = useCatalogData();

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-brand-900">Категории и бренды</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Используются в фильтрах каталога и на плитках категорий на главной.
      </p>

      {loading ? (
        <p className="mt-6 text-sm text-zinc-500">Загрузка…</p>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <TaxonomyEditor title="Назначение (категории)" table="purposes" items={purposes} onChange={refetch} />
          <TaxonomyEditor title="Бренды" table="brands" items={brands} onChange={refetch} />
        </div>
      )}
    </div>
  );
}
