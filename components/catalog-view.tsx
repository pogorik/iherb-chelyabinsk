"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CloseIcon, SearchIcon, SlidersIcon } from "./icons";
import { ProductCard } from "./product-card";
import { FilterSidebar } from "./filter-sidebar";
import { Button } from "./button";
import { useCatalogData } from "@/lib/catalog-data-context";
import { useQuickView } from "@/lib/quickview-context";
import type { AgeGroup } from "@/lib/types";

type SortKey = "default" | "price-asc" | "price-desc" | "name-asc" | "rating-desc";
const PAGE_SIZE = 12;

function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function CatalogView() {
  const searchParams = useSearchParams();
  const { products: allProducts, purposes: purposeOptions, brands: brandOptions, loading } = useCatalogData();
  const { open: openQuickView } = useQuickView();
  // Товары не в наличии видны только в админке, покупателю на витрине не показываем вовсе.
  const products = useMemo(() => allProducts.filter((product) => product.inStock), [allProducts]);

  const [ageGroup, setAgeGroup] = useState<AgeGroup | "all">("all");
  const [saleOnly, setSaleOnly] = useState(false);
  const [purposes, setPurposes] = useState<string[]>([]);
  const [components, setComponents] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("default");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const priceBounds = useMemo(() => {
    if (products.length === 0) return { min: 0, max: 0 };
    const prices = products.map((p) => p.price);
    return {
      min: Math.floor(Math.min(...prices) / 10) * 10,
      max: Math.ceil(Math.max(...prices) / 10) * 10,
    };
  }, [products]);

  const priceInitialized = useRef(false);
  useEffect(() => {
    if (!priceInitialized.current && products.length > 0) {
      setPriceRange([priceBounds.min, priceBounds.max]);
      priceInitialized.current = true;
    }
  }, [products.length, priceBounds]);

  useEffect(() => {
    // Only read the URL once, on first mount, to seed filters from a link
    // like /catalog?purpose=immunity — not a derived-state sync loop.
    const purposeParam = searchParams.get("purpose");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (purposeParam) setPurposes([purposeParam]);
    if (searchParams.get("sale") === "1") setSaleOnly(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const productParam = searchParams.get("product");
  const openedFromLinkRef = useRef(false);
  useEffect(() => {
    // Ссылка вида /catalog?product=<slug> (её выдаёт админка) должна сразу
    // открывать быстрый просмотр нужного товара, включая товары не в наличии.
    if (openedFromLinkRef.current || !productParam || allProducts.length === 0) return;
    const target = allProducts.find((p) => p.slug === productParam || p.id === productParam);
    if (target) {
      openedFromLinkRef.current = true;
      openQuickView(target);
    }
  }, [productParam, allProducts, openQuickView]);

  const filtered = useMemo(() => {
    return products.filter((product) => {
      if (ageGroup !== "all" && product.ageGroup !== ageGroup) return false;
      if (saleOnly && !product.oldPrice) return false;
      if (purposes.length > 0 && !purposes.some((p) => product.purposes.includes(p))) return false;
      if (components.length > 0 && !components.some((c) => product.activeComponents.includes(c)))
        return false;
      if (brands.length > 0 && !brands.includes(product.brand)) return false;
      if (product.price < priceRange[0] || product.price > priceRange[1]) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (!product.name.toLowerCase().includes(q) && !product.brand.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [products, ageGroup, saleOnly, purposes, components, brands, priceRange, search]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    switch (sort) {
      case "price-asc":
        list.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list.sort((a, b) => b.price - a.price);
        break;
      case "name-asc":
        list.sort((a, b) => a.name.localeCompare(b.name, "ru"));
        break;
      case "rating-desc":
        list.sort((a, b) => b.rating - a.rating);
        break;
      default:
        break;
    }
    return list;
  }, [filtered, sort]);

  useEffect(() => {
    // Reset pagination whenever any filter changes; visibleCount is also
    // incremented independently by "Показать ещё", so it can't be derived
    // during render — it genuinely needs to be synced from two sources.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisibleCount(PAGE_SIZE);
  }, [ageGroup, saleOnly, purposes, components, brands, priceRange, search, sort]);

  const visible = sorted.slice(0, visibleCount);

  function resetFilters() {
    setAgeGroup("all");
    setSaleOnly(false);
    setPurposes([]);
    setComponents([]);
    setBrands([]);
    setPriceRange([priceBounds.min, priceBounds.max]);
    setSearch("");
  }

  const activeFilterCount =
    purposes.length + components.length + brands.length + (saleOnly ? 1 : 0);

  const filterProps = {
    ageGroup,
    setAgeGroup,
    saleOnly,
    setSaleOnly,
    purposeOptions,
    purposes,
    togglePurpose: (slug: string) => setPurposes((prev) => toggleValue(prev, slug)),
    components,
    toggleComponent: (slug: string) => setComponents((prev) => toggleValue(prev, slug)),
    brandOptions,
    brands,
    toggleBrand: (slug: string) => setBrands((prev) => toggleValue(prev, slug)),
    priceMin: priceBounds.min,
    priceMax: priceBounds.max,
    priceRange,
    setPriceRange,
    onReset: resetFilters,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="flex items-center gap-1 text-xs text-zinc-400">
        <Link href="/" className="hover:text-brand-600">
          Главная
        </Link>
        <span>/</span>
        <span className="text-brand-700">Каталог</span>
      </nav>

      <h1 className="mt-2 font-display text-3xl font-semibold text-brand-900">Каталог товаров</h1>

      <div className="mt-6 flex flex-col gap-8 lg:flex-row">
        <aside className="hidden lg:block lg:w-72 lg:shrink-0">
          <FilterSidebar {...filterProps} />
        </aside>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-xs">
              <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-accent-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Поиск по каталогу"
                className="w-full rounded-full border-2 border-accent-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm outline-none transition focus:border-accent-500 focus:shadow-md"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(true)}
                className="flex items-center gap-1.5 rounded-full border border-line px-4 py-2.5 text-sm font-medium text-brand-900 transition hover:bg-brand-50 lg:hidden"
              >
                <SlidersIcon className="h-4 w-4" />
                Фильтры {activeFilterCount > 0 && `(${activeFilterCount})`}
              </button>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as SortKey)}
                className="rounded-full border border-line px-4 py-2.5 text-sm text-brand-900 outline-none focus:border-brand-400"
              >
                <option value="default">Сортировка: популярные</option>
                <option value="price-asc">Цена: сначала дешевле</option>
                <option value="price-desc">Цена: сначала дороже</option>
                <option value="name-asc">Название: А-Я</option>
                <option value="rating-desc">По рейтингу</option>
              </select>
            </div>
          </div>

          <p className="mt-4 text-sm text-zinc-500">Найдено {sorted.length} товаров</p>

          {loading && products.length === 0 ? (
            <div className="mt-16 flex flex-col items-center text-center text-zinc-500">
              <p className="text-sm">Загрузка каталога…</p>
            </div>
          ) : visible.length === 0 ? (
            <div className="mt-16 flex flex-col items-center text-center text-zinc-500">
              <p className="text-base font-medium text-brand-900">Ничего не найдено</p>
              <p className="mt-1 text-sm">Попробуйте изменить фильтры или запрос поиска.</p>
              <Button variant="primary" className="mt-4" onClick={resetFilters}>
                Сбросить фильтры
              </Button>
            </div>
          ) : (
            <>
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {visible.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              {visibleCount < sorted.length && (
                <div className="mt-10 flex justify-center">
                  <Button
                    variant="outline-dark"
                    onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                  >
                    Показать ещё
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden" onClick={() => setMobileFiltersOpen(false)}>
          <div className="absolute inset-0 bg-brand-950/50" />
          <div
            className="relative ml-auto flex h-full w-full max-w-xs flex-col overflow-y-auto rounded-l-[28px] border-l border-line bg-white p-4 shadow-[0_20px_60px_rgba(0,0,0,0.08)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2">
              <p className="text-base font-semibold text-brand-900">Фильтры</p>
              <button type="button" onClick={() => setMobileFiltersOpen(false)} aria-label="Закрыть">
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
            <FilterSidebar {...filterProps} />
            <Button
              variant="accent"
              size="lg"
              fullWidth
              className="sticky bottom-0 mt-4"
              onClick={() => setMobileFiltersOpen(false)}
            >
              Показать {sorted.length} товаров
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
