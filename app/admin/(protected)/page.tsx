"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/utils";

interface OrderItem {
  product_id: string;
  name: string;
  qty: number;
  price: number;
  line_total: number;
}

interface OrderRow {
  id: string;
  created_at: string;
  items: OrderItem[];
  total_price: number;
  status: "new" | "processing" | "done" | "cancelled";
}

interface Stats {
  ordersCount: number;
  revenue: number;
  topProducts: Array<{ name: string; qty: number }>;
  newOrders: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase
          .from("orders")
          .select("id, created_at, items, total_price, status")
          .order("created_at", { ascending: false });

        const orders = (data as OrderRow[] | null) ?? [];
        const active = orders.filter((order) => order.status !== "cancelled");

        const qtyByProduct = new Map<string, { name: string; qty: number }>();
        for (const order of active) {
          for (const item of order.items ?? []) {
            const existing = qtyByProduct.get(item.product_id);
            if (existing) {
              existing.qty += item.qty;
            } else {
              qtyByProduct.set(item.product_id, { name: item.name, qty: item.qty });
            }
          }
        }
        const topProducts = Array.from(qtyByProduct.values())
          .sort((a, b) => b.qty - a.qty)
          .slice(0, 5);

        setStats({
          ordersCount: orders.length,
          revenue: active.reduce((sum, order) => sum + order.total_price, 0),
          topProducts,
          newOrders: orders.filter((order) => order.status === "new").length,
        });
      } catch (error) {
        console.error("Не удалось загрузить статистику", error);
        setStats({ ordersCount: 0, revenue: 0, topProducts: [], newOrders: 0 });
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-brand-900">Дашборд</h1>

      {loading ? (
        <p className="mt-6 text-sm text-zinc-500">Загрузка статистики…</p>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[20px] border border-line bg-white p-5">
              <p className="text-sm text-zinc-500">Всего заказов</p>
              <p className="mt-1 font-display text-3xl font-semibold text-brand-900">
                {stats?.ordersCount ?? 0}
              </p>
              {stats && stats.newOrders > 0 && (
                <p className="mt-1 text-xs text-accent-600">Новых: {stats.newOrders}</p>
              )}
            </div>
            <div className="rounded-[20px] border border-line bg-white p-5">
              <p className="text-sm text-zinc-500">Выручка</p>
              <p className="mt-1 font-display text-3xl font-semibold text-brand-900">
                {formatPrice(stats?.revenue ?? 0)}
              </p>
              <p className="mt-1 text-xs text-zinc-400">без отменённых заказов</p>
            </div>
            <div className="rounded-[20px] border border-line bg-white p-5">
              <p className="text-sm text-zinc-500">Средний чек</p>
              <p className="mt-1 font-display text-3xl font-semibold text-brand-900">
                {formatPrice(
                  stats && stats.ordersCount > 0 ? Math.round(stats.revenue / stats.ordersCount) : 0
                )}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-[20px] border border-line bg-white p-5">
            <p className="text-sm font-semibold text-brand-900">Топ товаров по продажам</p>
            {stats && stats.topProducts.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {stats.topProducts.map((product, index) => (
                  <li key={product.name} className="flex items-center justify-between text-sm">
                    <span className="text-zinc-600">
                      {index + 1}. {product.name}
                    </span>
                    <span className="font-medium text-brand-900">{product.qty} шт.</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-zinc-500">Пока нет данных — заказов ещё не было.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
