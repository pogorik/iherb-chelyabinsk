"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useCatalogData } from "@/lib/catalog-data-context";
import { ACTIVE_COMPONENTS, FORM_LABELS } from "@/lib/products";
import { Button } from "@/components/button";
import { CloseIcon } from "@/components/icons";
import type { Product } from "@/lib/types";

const ACCENT_OPTIONS: Product["accent"][] = ["brand", "accent", "leaf", "amber", "berry"];
const FORM_OPTIONS = Object.keys(FORM_LABELS) as Product["form"][];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const { purposes: purposeOptions, refetch } = useCatalogData();
  const isEdit = Boolean(product);

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [brand, setBrand] = useState(product?.brand ?? "");
  const [price, setPrice] = useState(String(product?.price ?? ""));
  const [oldPrice, setOldPrice] = useState(product?.oldPrice ? String(product.oldPrice) : "");
  const [ageGroup, setAgeGroup] = useState<Product["ageGroup"]>(product?.ageGroup ?? "adult");
  const [form, setForm] = useState<Product["form"]>(product?.form ?? "capsules");
  const [volume, setVolume] = useState(product?.volume ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [rating, setRating] = useState(String(product?.rating ?? 4.5));
  const [reviewsCount, setReviewsCount] = useState(String(product?.reviewsCount ?? 0));
  const [stockQuantity, setStockQuantity] = useState(String(product?.stockQuantity ?? 10));
  const [isHit, setIsHit] = useState(product?.isHit ?? false);
  const [accent, setAccent] = useState<Product["accent"]>(product?.accent ?? "brand");
  const [purposes, setPurposes] = useState<string[]>(product?.purposes ?? []);
  const [activeComponents, setActiveComponents] = useState<string[]>(product?.activeComponents ?? []);
  const [imageUrls, setImageUrls] = useState<string[]>(product?.imageUrls ?? []);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setImageError("Выберите файл изображения (JPG, PNG, WEBP).");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setImageError("Файл слишком большой (максимум 5 МБ).");
      return;
    }

    setImageError(null);
    setUploadingImage(true);

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", { method: "POST", body: formData });
    setUploadingImage(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setImageError(data.error ?? "Не удалось загрузить фото");
      return;
    }

    const data = await response.json();
    setImageUrls((prev) => [...prev, data.url]);
  }

  function removeImage(url: string) {
    setImageUrls((prev) => prev.filter((item) => item !== url));
  }

  function moveImageFirst(url: string) {
    setImageUrls((prev) => [url, ...prev.filter((item) => item !== url)]);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const row = {
      slug,
      name,
      brand,
      price: Number(price),
      old_price: oldPrice ? Number(oldPrice) : null,
      age_group: ageGroup,
      purposes,
      active_components: activeComponents,
      form,
      volume,
      description,
      rating: Number(rating),
      reviews_count: Number(reviewsCount),
      stock_quantity: Number(stockQuantity),
      in_stock: Number(stockQuantity) > 0,
      is_hit: isHit,
      accent,
      image_url: imageUrls[0] ?? null,
      image_urls: imageUrls,
    };

    const response = isEdit
      ? await fetch(`/api/products/${product!.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(row),
        })
      : await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(row),
        });

    setSubmitting(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Не удалось сохранить товар");
      return;
    }

    refetch();
    router.push("/admin/products");
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      <div className="mb-4">
        <p className="mb-2 text-sm text-zinc-600">Фото товара</p>
        <div className="flex flex-wrap gap-3">
          {imageUrls.map((url, index) => (
            <div key={url} className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-sand-100">
              {/* eslint-disable-next-line @next/next/no-img-element -- static export + Supabase Storage host */}
              <img src={url} alt="" className="h-full w-full object-cover" />
              {index === 0 ? (
                <span className="absolute bottom-1 left-1 rounded-full bg-brand-900/80 px-2 py-0.5 text-[10px] font-medium text-white">
                  Главное
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => moveImageFirst(url)}
                  className="absolute inset-x-1 bottom-1 rounded-full bg-black/60 py-0.5 text-[10px] font-medium text-white opacity-0 transition group-hover:opacity-100"
                >
                  Сделать главным
                </button>
              )}
              <button
                type="button"
                onClick={() => removeImage(url)}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-brand-700 shadow-sm transition hover:text-accent-600"
                aria-label="Удалить фото"
              >
                <CloseIcon className="h-3 w-3" />
              </button>
            </div>
          ))}

          <label className="flex h-24 w-24 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-line text-center text-xs font-medium text-brand-700 transition hover:bg-brand-50">
            {uploadingImage ? "Загружаем…" : "+ Добавить фото"}
            <input
              type="file"
              accept="image/*"
              disabled={uploadingImage}
              onChange={handleImageChange}
              className="hidden"
            />
          </label>
        </div>
        <p className="mt-2 text-xs text-zinc-400">
          JPG, PNG или WEBP, до 5 МБ. Первое фото показывается в каталоге и на карточке товара.
        </p>
        {imageError && <p className="mt-2 text-sm text-accent-600">{imageError}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1 block text-zinc-600">Название</span>
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand-400"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-zinc-600">Slug (латиницей, для ссылки)</span>
          <input
            required
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            placeholder="vitamin-d3-2000"
            className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand-400"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-zinc-600">Бренд</span>
          <input
            required
            value={brand}
            onChange={(event) => setBrand(event.target.value)}
            className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand-400"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-zinc-600">Цена, ₽</span>
          <input
            required
            type="number"
            min={0}
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand-400"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-zinc-600">Старая цена, ₽ (для скидки, необязательно)</span>
          <input
            type="number"
            min={0}
            value={oldPrice}
            onChange={(event) => setOldPrice(event.target.value)}
            className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand-400"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-zinc-600">Возрастная группа</span>
          <select
            value={ageGroup}
            onChange={(event) => setAgeGroup(event.target.value as Product["ageGroup"])}
            className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand-400"
          >
            <option value="adult">Взрослые</option>
            <option value="kids">Дети</option>
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-zinc-600">Форма выпуска</span>
          <select
            value={form}
            onChange={(event) => setForm(event.target.value as Product["form"])}
            className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand-400"
          >
            {FORM_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {FORM_LABELS[option]}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-zinc-600">Объём/количество</span>
          <input
            required
            value={volume}
            onChange={(event) => setVolume(event.target.value)}
            placeholder="60 капсул"
            className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand-400"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-zinc-600">Цветовой акцент карточки</span>
          <select
            value={accent}
            onChange={(event) => setAccent(event.target.value as Product["accent"])}
            className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand-400"
          >
            {ACCENT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm sm:col-span-2">
          <span className="mb-1 block text-zinc-600">Описание</span>
          <textarea
            required
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand-400"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-zinc-600">Рейтинг (0–5)</span>
          <input
            type="number"
            min={0}
            max={5}
            step={0.1}
            value={rating}
            onChange={(event) => setRating(event.target.value)}
            className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand-400"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-zinc-600">Количество отзывов</span>
          <input
            type="number"
            min={0}
            value={reviewsCount}
            onChange={(event) => setReviewsCount(event.target.value)}
            className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand-400"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-zinc-600">Количество в наличии, шт.</span>
          <input
            required
            type="number"
            min={0}
            value={stockQuantity}
            onChange={(event) => setStockQuantity(event.target.value)}
            className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand-400"
          />
          <span className="mt-1 block text-xs text-zinc-400">0 — товар считается «Нет в наличии»</span>
        </label>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-sm text-zinc-600">Назначение</p>
        <div className="flex flex-wrap gap-2">
          {purposeOptions.map((option) => (
            <button
              key={option.slug}
              type="button"
              onClick={() => setPurposes((prev) => toggleValue(prev, option.slug))}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                purposes.includes(option.slug)
                  ? "border-brand-900 bg-brand-900 text-white"
                  : "border-line text-brand-800 hover:bg-brand-50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-sm text-zinc-600">Активный компонент</p>
        <div className="flex flex-wrap gap-2">
          {ACTIVE_COMPONENTS.map((option) => (
            <button
              key={option.slug}
              type="button"
              onClick={() => setActiveComponents((prev) => toggleValue(prev, option.slug))}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                activeComponents.includes(option.slug)
                  ? "border-brand-900 bg-brand-900 text-white"
                  : "border-line text-brand-800 hover:bg-brand-50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm text-zinc-600">
          <input type="checkbox" checked={isHit} onChange={(event) => setIsHit(event.target.checked)} />
          Показывать в «Хитах» на главной
        </label>
      </div>

      {error && <p className="mt-4 text-sm text-accent-600">{error}</p>}

      <div className="mt-6 flex gap-2">
        <Button href="/admin/products" variant="outline-dark">
          Отмена
        </Button>
        <Button type="submit" variant="accent" disabled={submitting}>
          {submitting ? "Сохраняем…" : isEdit ? "Сохранить изменения" : "Добавить товар"}
        </Button>
      </div>
    </form>
  );
}
