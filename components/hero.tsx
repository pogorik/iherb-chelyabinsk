"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "./button";
import { ContactsModal } from "./contacts-modal";
import { GlobeIcon, TruckIcon } from "./icons";
import { useSiteSettings } from "@/lib/site-settings-context";

export function Hero() {
  const { settings } = useSiteSettings();
  const [contactsOpen, setContactsOpen] = useState(false);

  return (
    <section className="relative overflow-hidden px-4 py-10 sm:px-6 sm:py-14 lg:px-6 lg:py-10">
      <Image
        src="/hero-bg.png"
        alt=""
        fill
        priority
        className="object-cover"
      />
      <div className="relative mx-auto flex max-w-[560px] flex-col items-center rounded-[28px] border border-line bg-white/90 p-6 text-center shadow-[0_20px_60px_rgba(0,0,0,0.15)] backdrop-blur-md sm:p-9 lg:max-w-3xl lg:min-h-[calc(100vh-64px-3rem)] lg:justify-center lg:p-16 xl:max-w-4xl">
        <h1 className="whitespace-pre-line font-brand text-[32px] font-bold leading-[1.1] text-brand-950 sm:text-[40px] lg:text-[56px] xl:text-[64px]">
          {settings.heroTitle}
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-zinc-500 lg:text-lg">
          {settings.heroSubtitle}
        </p>

        <div className="mt-6 flex w-full max-w-xl flex-col gap-2.5">
          <Button href="/catalog" variant="accent" size="lg" fullWidth className="lg:h-16 lg:text-lg">
            Каталог
          </Button>
          <div className="flex gap-2.5">
            <a
              href="#highlights"
              className="flex min-h-11 flex-1 items-center justify-center rounded-full border border-line px-4 py-2 text-center text-sm font-semibold text-brand-900 transition hover:-translate-y-0.5 hover:bg-brand-50 lg:min-h-[3.25rem] lg:text-base"
            >
              Подразделы
            </a>
            <button
              type="button"
              onClick={() => setContactsOpen(true)}
              className="flex min-h-11 flex-1 items-center justify-center rounded-full border border-line px-4 py-2 text-center text-sm font-semibold text-brand-900 transition hover:-translate-y-0.5 hover:bg-brand-50 lg:min-h-[3.25rem] lg:text-base"
            >
              Контакты и пункты выдачи
            </button>
          </div>
        </div>

        <div className="mt-5 flex w-full max-w-xl items-center justify-center gap-2.5 rounded-2xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">
          <GlobeIcon className="h-4 w-4 shrink-0" />
          Вся продукция оригинальная, доставляется с американского сайта
        </div>

        <div className="mt-5 flex max-w-xl flex-wrap justify-center gap-x-6 gap-y-2 border-t border-line pt-5 text-xs text-zinc-400 lg:pt-6 lg:text-base lg:font-medium lg:text-brand-700">
          <span className="flex items-center gap-1.5">
            <TruckIcon className="h-4 w-4 lg:h-5 lg:w-5" /> Доставка по Челябинску и по всей России
          </span>
        </div>
      </div>

      <ContactsModal isOpen={contactsOpen} onClose={() => setContactsOpen(false)} />
    </section>
  );
}
