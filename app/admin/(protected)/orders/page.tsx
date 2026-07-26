"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/utils";

type OrderStatus = "new" | "processing" | "done" | "cancelled";

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
  customer_name: string;
  customer_phone: string;
  fulfillment: string | null;
  customer_comment: string | null;
  items: OrderItem[];
  total_price: number;
  status: OrderStatus;
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  new: "Новый",
  processing: "В обработке",
  done: "Выполнен",
  cancelled: "Отменён",
};

const STATUS_TONES: Record<OrderStatus, string> = {
  new: "bg-brand-50 text-brand-700",
  processing: "bg-amber-50 text-amber-700",
  done: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-zinc-100 text-zinc-500",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      setOrders((data as OrderRow[] | null) ?? []);
    } catch (error) {
      console.error("Не удалось загрузить заказы", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Fetch on mount — load() calls setState once the request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  async function handleStatusChange(id: string, status: OrderStatus) {
    setUpdatingId(id);
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    setUpdatingId(null);
    if (error) {
      window.alert("Не удалось обновить статус: " + error.message);
      return;
    }
    setOrders((prev) => prev.map((order) => (order.id === id ? { ...order, status } : order)));
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-brand-900">
        Заказы {!loading && `(${orders.length})`}
      </h1>

      <div className="mt-6 space-y-3">
        {loading ? (
          <p className="text-sm text-zinc-500">Загрузка…</p>
        ) : orders.length === 0 ? (
          <p className="text-sm text-zinc-500">Заказов пока нет.</p>
        ) : (
          orders.map((order) => {
            const isOpen = expandedId === order.id;
            return (
              <div key={order.id} className="rounded-[20px] border border-line bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isOpen ? null : order.id)}
                    className="flex flex-1 flex-wrap items-center gap-3 text-left"
                  >
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_TONES[order.status]}`}
                    >
                      {STATUS_LABELS[order.status]}
                    </span>
                    <span className="text-sm font-medium text-brand-900">{order.customer_name}</span>
                    <span className="text-sm text-zinc-500">{order.customer_phone}</span>
                    <span className="text-xs text-zinc-400">
                      {new Date(order.created_at).toLocaleString("ru-RU")}
                    </span>
                    <span className="ml-auto text-sm font-semibold text-brand-900">
                      {formatPrice(order.total_price)}
                    </span>
                  </button>

                  <select
                    value={order.status}
                    disabled={updatingId === order.id}
                    onChange={(event) => handleStatusChange(order.id, event.target.value as OrderStatus)}
                    className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-brand-900 outline-none focus:border-brand-400"
                  >
                    {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((status) => (
                      <option key={status} value={status}>
                        {STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                </div>

                {isOpen && (
                  <div className="mt-3 border-t border-line pt-3">
                    {order.fulfillment && (
                      <p className="mb-2 text-sm text-zinc-600">
                        Способ получения: {order.fulfillment}
                      </p>
                    )}
                    {order.customer_comment && (
                      <p className="mb-2 text-sm text-zinc-600">
                        Комментарий: {order.customer_comment}
                      </p>
                    )}
                    <ul className="space-y-1 text-sm text-zinc-600">
                      {order.items.map((item, index) => (
                        <li key={`${order.id}-${index}`} className="flex justify-between">
                          <span>
                            {item.name} × {item.qty}
                          </span>
                          <span className="text-brand-900">{formatPrice(item.line_total)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
