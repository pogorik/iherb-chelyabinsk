"use client";

import { HeartIcon, StarIcon, TruckIcon } from "./icons";
import { useSiteSettings } from "@/lib/site-settings-context";
import type { ComponentType } from "react";

const POINTS: Array<{
  icon: ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}> = [
  {
    icon: StarIcon,
    title: "Подбор по назначению",
    desc: "Фильтры по цели, составу и бренду помогают быстро найти нужное.",
  },
  {
    icon: TruckIcon,
    title: "Доставка по Челябинску и по всей России",
    desc: "Отправляем заказы в любой регион, сроки уточняет менеджер.",
  },
  {
    icon: HeartIcon,
    title: "Консультация перед покупкой",
    desc: "Ответим на вопросы о составе и подберём аналог, если нужно.",
  },
];

export function WhyUs() {
  const { settings } = useSiteSettings();
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <h2 className="font-display text-2xl font-semibold text-brand-900 sm:text-3xl">
        Почему выбирают {settings.name}
      </h2>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {POINTS.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-[20px] border border-line bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(15,44,70,0.1)]">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Icon className="h-5 w-5" />
            </span>
            <p className="mt-4 text-sm font-semibold text-brand-900">{title}</p>
            <p className="mt-1.5 text-sm text-zinc-500">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
