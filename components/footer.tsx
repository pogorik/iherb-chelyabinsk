"use client";

import Link from "next/link";
import { MapPinIcon, MaxIcon, PhoneIcon, WhatsAppIcon } from "./icons";
import { useSiteSettings } from "@/lib/site-settings-context";
import { PICKUP_POINTS } from "@/lib/fulfillment";

export function Footer() {
  const { settings } = useSiteSettings();
  return (
    <footer id="contacts" className="mt-20 scroll-mt-20 border-t border-line bg-accent-700 text-accent-100">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-semibold text-accent-700">
                N
              </span>
              <span className="font-display text-lg font-semibold text-white">{settings.name}</span>
            </div>
            <p className="mt-3 text-sm text-accent-100">{settings.tagline}</p>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">Навигация</p>
            <ul className="mt-3 space-y-2 text-sm text-accent-100">
              <li>
                <Link href="/" className="hover:text-white">
                  Главная
                </Link>
              </li>
              <li>
                <Link href="/catalog" className="hover:text-white">
                  Каталог
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white">
                  Обработка персональных данных
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">Контакты</p>
            <ul className="mt-3 space-y-2 text-sm text-accent-100">
              <li className="flex items-center gap-2">
                <PhoneIcon className="h-4 w-4 shrink-0" />
                {settings.phone}
              </li>
              <li className="flex items-center gap-2">
                <WhatsAppIcon className="h-4 w-4 shrink-0" />
                Написать в WhatsApp
              </li>
              <li>
                <a
                  href={settings.maxHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-white"
                >
                  <MaxIcon className="h-4 w-4 shrink-0" />
                  Написать в MAX
                </a>
              </li>
              <li>{settings.address}</li>
              <li>{settings.workingHours}</li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">О магазине</p>
            <p className="mt-3 text-sm text-accent-100">
              Оригинальная продукция iHerb с доставкой по Челябинску и всей России.
            </p>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-8">
          <p className="text-sm font-semibold text-white">Пункты выдачи на карте</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PICKUP_POINTS.map((point) => (
              <a
                key={point.label}
                href={`https://yandex.ru/maps/?text=${encodeURIComponent(
                  `Челябинск, ${point.address}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-accent-100 transition hover:bg-white/10 hover:text-white"
              >
                <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  <span className="block font-medium text-white">{point.label}</span>
                  {point.address}
                </span>
              </a>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-accent-200 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {settings.name}. Все права защищены.
          </p>
          <p>18+ · БАД. Не является лекарственным средством.</p>
        </div>
      </div>
    </footer>
  );
}
