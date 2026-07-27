"use client";

import { useState } from "react";
import Link from "next/link";
import { useCatalogData } from "@/lib/catalog-data-context";
import { supabase } from "@/lib/supabase";
import { assetPath } from "@/lib/asset-path";
import { Button } from "@/components/button";
import { formatPrice } from "@/lib/utils";

type StockFilter = "all" | "in-stock" | "out-of-stock";

export default function AdminProductsPage() {
  const { products, loading, refetch } = useCatalogData();
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function handleCopyLink(id: string, slug: string) {
    const url = `${window.location.origin}${assetPath("/catalog")}?product=${slug}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1500);
  }

  const filtered = products.filter((product) => {
    if (stockFilter === "in-stock" && !product.inStock) return false;
    if (stockFilter === "out-of-stock" && product.inStock) return false;
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return product.name.toLowerCase().includes(q) || product.brand.toLowerCase().includes(q);
  });

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Удалить товар «${name}»? Это действие нельзя отменить.`)) return;
    setDeletingId(id);
    const { error } = await supabase.from("products").delete().eq("id", id);
    setDeletingId(null);
    if (error) {
      window.alert("Не удалось удалить товар: " + error.message);
      return;
    }
    refetch();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-semibold text-brand-900">
          Товары {!loading && `(${products.length})`}
        </h1>
        <Button href="/admin/products/new" variant="accent">
          Добавить товар
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Поиск по названию или бренду"
          className="w-full max-w-sm rounded-full border border-line px-4 py-2.5 text-sm outline-none focus:border-brand-400"
        />
        <select
          value={stockFilter}
          onChange={(event) => setStockFilter(event.target.value as StockFilter)}
          className="rounded-full border border-line px-4 py-2.5 text-sm text-brand-900 outline-none focus:border-brand-400"
        >
          <option value="all">Все товары</option>
          <option value="in-stock">В наличии</option>
          <option value="out-of-stock">Нет в наличии</option>
        </select>
      </div>

      <div className="mt-6 overflow-x-auto rounded-[20px] border border-line bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">Товар</th>
              <th className="px-4 py-3 font-medium">Бренд</th>
              <th className="px-4 py-3 font-medium">Цена</th>
              <th className="px-4 py-3 font-medium">Кол-во</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                  Загрузка…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                  Ничего не найдено
                </td>
              </tr>
            ) : (
              filtered.map((product) => (
                <tr key={product.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium text-brand-900">{product.name}</td>
                  <td className="px-4 py-3 text-zinc-600">{product.brand}</td>
                  <td className="px-4 py-3 text-zinc-600">{formatPrice(product.price)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        product.inStock ? "bg-brand-50 text-brand-700" : "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      {product.inStock ? `${product.stockQuantity ?? "—"} шт.` : "Нет в наличии"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyLink(product.id, product.slug)}
                        className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-brand-900 transition hover:bg-brand-50"
                      >
                        {copiedId === product.id ? "Ссылка скопирована" : "Скопировать ссылку"}
                      </button>
                      <Link
                        href={`/admin/products/edit?id=${product.id}`}
                        className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-brand-900 transition hover:bg-brand-50"
                      >
                        Редактировать
                      </Link>
                      <button
                        type="button"
                        disabled={deletingId === product.id}
                        onClick={() => handleDelete(product.id, product.name)}
                        className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-accent-600 transition hover:bg-accent-50 disabled:opacity-50"
                      >
                        {deletingId === product.id ? "Удаление…" : "Удалить"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
