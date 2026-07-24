"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAdminAuth } from "@/lib/admin-auth-context";

const NAV_ITEMS = [
  { href: "/admin", label: "Дашборд" },
  { href: "/admin/products", label: "Товары" },
  { href: "/admin/categories", label: "Категории и бренды" },
  { href: "/admin/settings", label: "Настройки" },
  { href: "/admin/orders", label: "Заказы" },
];

export default function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { session, loading, signOut } = useAdminAuth();

  useEffect(() => {
    if (!loading && !session) router.replace("/admin/login");
  }, [loading, session, router]);

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sand-50 text-sm text-zinc-500">
        Загрузка…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand-50">
      <div className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-900 text-sm font-semibold text-white">
              N
            </span>
            <span className="font-display text-lg font-semibold text-brand-900">Админка</span>
          </div>

          <nav className="flex flex-wrap items-center gap-1 text-sm font-medium text-brand-800">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-3.5 py-2 transition ${
                    active ? "bg-brand-900 text-white" : "hover:bg-brand-50"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() => signOut()}
            className="rounded-full border border-line px-3.5 py-2 text-sm font-medium text-brand-900 transition hover:bg-brand-50"
          >
            Выйти
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
