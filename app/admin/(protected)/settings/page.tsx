"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useSiteSettings } from "@/lib/site-settings-context";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/button";

export default function AdminSettingsPage() {
  const { settings, loading, refetch } = useSiteSettings();
  const [form, setForm] = useState(settings);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Seed the editable draft once settings finish loading from Supabase.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!loading) setForm(settings);
  }, [loading, settings]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const { error: dbError } = await supabase
      .from("site_settings")
      .update({
        name: form.name,
        tagline: form.tagline,
        hero_title: form.heroTitle,
        hero_subtitle: form.heroSubtitle,
        phone: form.phone,
        phone_href: form.phoneHref,
        whatsapp_number: form.whatsappNumber,
        telegram_username: form.telegramUsername,
        max_href: form.maxHref,
        email: form.email,
        address: form.address,
        working_hours: form.workingHours,
        vk_url: form.vkUrl,
        pickup_info: form.pickupInfo,
      })
      .eq("id", 1);

    setSubmitting(false);

    if (dbError) {
      setError(dbError.message);
      return;
    }

    refetch();
    setSaved(true);
  }

  if (loading) {
    return <p className="text-sm text-zinc-500">Загрузка…</p>;
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-brand-900">Настройки сайта</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Изменения видны на сайте сразу после обновления страницы.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 max-w-2xl space-y-6">
        <div className="rounded-[20px] border border-line bg-white p-5">
          <p className="text-sm font-semibold text-brand-900">Главный экран</p>
          <div className="mt-3 space-y-3">
            <label className="block text-sm">
              <span className="mb-1 block text-zinc-600">Заголовок hero</span>
              <textarea
                rows={2}
                value={form.heroTitle}
                onChange={(event) => update("heroTitle", event.target.value)}
                className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand-400"
              />
              <span className="mt-1 block text-xs text-zinc-400">
                Перенос строки — новая строка в заголовке
              </span>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-zinc-600">Подзаголовок hero</span>
              <textarea
                rows={3}
                value={form.heroSubtitle}
                onChange={(event) => update("heroSubtitle", event.target.value)}
                className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand-400"
              />
            </label>
          </div>
        </div>

        <div className="rounded-[20px] border border-line bg-white p-5">
          <p className="text-sm font-semibold text-brand-900">О магазине</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-zinc-600">Название</span>
              <input
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand-400"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-zinc-600">Слоган</span>
              <input
                value={form.tagline}
                onChange={(event) => update("tagline", event.target.value)}
                className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand-400"
              />
            </label>
          </div>
        </div>

        <div className="rounded-[20px] border border-line bg-white p-5">
          <p className="text-sm font-semibold text-brand-900">Контакты и соцсети</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-zinc-600">Телефон (отображаемый)</span>
              <input
                value={form.phone}
                onChange={(event) => update("phone", event.target.value)}
                className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand-400"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-zinc-600">Телефон (ссылка tel:...)</span>
              <input
                value={form.phoneHref}
                onChange={(event) => update("phoneHref", event.target.value)}
                placeholder="tel:+79000000000"
                className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand-400"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-zinc-600">WhatsApp номер (без +, для wa.me)</span>
              <input
                value={form.whatsappNumber}
                onChange={(event) => update("whatsappNumber", event.target.value)}
                placeholder="79000000000"
                className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand-400"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-zinc-600">Telegram username (без @)</span>
              <input
                value={form.telegramUsername}
                onChange={(event) => update("telegramUsername", event.target.value)}
                className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand-400"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-zinc-600">Ссылка на MAX</span>
              <input
                value={form.maxHref}
                onChange={(event) => update("maxHref", event.target.value)}
                className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand-400"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-zinc-600">Email</span>
              <input
                value={form.email}
                onChange={(event) => update("email", event.target.value)}
                className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand-400"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-zinc-600">Адрес</span>
              <input
                value={form.address}
                onChange={(event) => update("address", event.target.value)}
                className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand-400"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-zinc-600">Часы работы</span>
              <input
                value={form.workingHours}
                onChange={(event) => update("workingHours", event.target.value)}
                className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand-400"
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1 block text-zinc-600">Ссылка на группу ВКонтакте</span>
              <input
                value={form.vkUrl}
                onChange={(event) => update("vkUrl", event.target.value)}
                placeholder="https://vk.ru/..."
                className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand-400"
              />
            </label>
          </div>
        </div>

        <div className="rounded-[20px] border border-line bg-white p-5">
          <p className="text-sm font-semibold text-brand-900">Пункты выдачи и доставка</p>
          <p className="mt-1 text-xs text-zinc-400">
            Показывается в модалке «Контакты и пункты выдачи» на главной. Перенос строки — новая строка.
          </p>
          <textarea
            rows={8}
            value={form.pickupInfo}
            onChange={(event) => update("pickupInfo", event.target.value)}
            className="mt-3 w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand-400"
          />
        </div>

        {error && <p className="text-sm text-accent-600">{error}</p>}
        {saved && <p className="text-sm text-brand-600">Сохранено.</p>}

        <Button type="submit" variant="accent" disabled={submitting}>
          {submitting ? "Сохраняем…" : "Сохранить"}
        </Button>
      </form>
    </div>
  );
}
