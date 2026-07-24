"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CartIcon, CloseIcon, DotsIcon, MaxIcon, MenuIcon, PhoneIcon, TelegramIcon, WhatsAppIcon } from "./icons";
import { useCart } from "@/lib/cart-context";
import { useSiteSettings } from "@/lib/site-settings-context";
import { buildWhatsAppLink } from "@/lib/order";
import { assetPath } from "@/lib/asset-path";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { totalCount, openCart } = useCart();
  const { settings } = useSiteSettings();

  const contactLinks = [
    { href: settings.phoneHref, label: settings.phone, icon: PhoneIcon },
    { href: settings.maxHref, label: "MAX", icon: MaxIcon },
    { href: `https://t.me/${settings.telegramUsername}`, label: "Telegram", icon: TelegramIcon },
    {
      href: buildWhatsAppLink(
        `Здравствуйте!`,
        settings.whatsappNumber
      ),
      label: "WhatsApp",
      icon: WhatsAppIcon,
    },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center">
          <Image src={assetPath("/logo.png")} alt={settings.name} width={2048} height={768} className="h-8 w-auto sm:h-9 lg:h-12" priority />
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-brand-800 md:flex">
          <Link href="/" className="transition hover:text-brand-500">
            Главная
          </Link>
          <Link href="/catalog" className="transition hover:text-brand-500">
            Каталог
          </Link>
        </nav>

        <div className="flex items-center gap-1.5">
          <a
            href={settings.phoneHref}
            className="hidden items-center gap-1.5 pr-1 text-sm font-medium text-brand-800 transition hover:text-brand-500 lg:flex"
          >
            <PhoneIcon className="h-4 w-4" />
            {settings.phone}
          </a>
          <a
            href={settings.maxHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Написать в MAX"
            className="hidden h-9 w-9 items-center justify-center rounded-full text-brand-700 transition hover:bg-brand-50 lg:flex"
          >
            <MaxIcon className="h-4 w-4" />
          </a>
          <a
            href={`https://t.me/${settings.telegramUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Написать в Telegram"
            className="hidden h-9 w-9 items-center justify-center rounded-full text-brand-700 transition hover:bg-brand-50 lg:flex"
          >
            <TelegramIcon className="h-4 w-4" />
          </a>
          <a
            href={buildWhatsAppLink(
              `Здравствуйте!`,
              settings.whatsappNumber
            )}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Написать в WhatsApp"
            className="mr-1 hidden h-9 w-9 items-center justify-center rounded-full text-brand-700 transition hover:bg-brand-50 lg:flex"
          >
            <WhatsAppIcon className="h-4 w-4" />
          </a>

          <details className="group relative lg:hidden">
            <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full text-brand-900 transition hover:bg-brand-50">
              <DotsIcon className="h-5 w-5" />
            </summary>
            <div className="absolute right-0 top-12 z-20 w-56 rounded-2xl border border-line bg-white p-2 text-left shadow-xl">
              {contactLinks.map(({ href, label, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith("tel:") ? undefined : "_blank"}
                  rel={href.startsWith("tel:") ? undefined : "noopener noreferrer"}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-brand-800 transition hover:bg-brand-50"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </a>
              ))}
            </div>
          </details>

          <button
            type="button"
            onClick={openCart}
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-brand-900 transition hover:bg-brand-50"
            aria-label="Корзина"
          >
            <CartIcon className="h-5 w-5" />
            {totalCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent-500 text-[11px] font-semibold text-white">
                {totalCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-brand-900 transition hover:bg-brand-50 md:hidden"
            aria-label="Меню"
          >
            {mobileOpen ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="flex flex-col gap-1 border-t border-line px-4 py-3 md:hidden">
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg px-3 py-2 text-sm font-medium text-brand-800 hover:bg-brand-50"
          >
            Главная
          </Link>
          <Link
            href="/catalog"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg px-3 py-2 text-sm font-medium text-brand-800 hover:bg-brand-50"
          >
            Каталог
          </Link>
        </nav>
      )}
    </header>
  );
}
