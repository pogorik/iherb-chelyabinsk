"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useCatalogData } from "@/lib/catalog-data-context";
import { ProductForm } from "@/components/admin/product-form";

function EditProductContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const { products, loading } = useCatalogData();

  if (loading && products.length === 0) {
    return <p className="text-sm text-zinc-500">Загрузка…</p>;
  }

  const product = products.find((p) => p.id === id);

  if (!product) {
    return <p className="text-sm text-zinc-500">Товар не найден. Возможно, он был удалён.</p>;
  }

  return <ProductForm product={product} />;
}

export default function EditProductPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-brand-900">Редактировать товар</h1>
      <div className="mt-6">
        <Suspense fallback={<p className="text-sm text-zinc-500">Загрузка…</p>}>
          <EditProductContent />
        </Suspense>
      </div>
    </div>
  );
}
