"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { isSupabaseConfigured, supabase } from "./supabase";
import type { FilterOption, Product } from "./types";

interface ProductRow {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  old_price: number | null;
  age_group: Product["ageGroup"];
  purposes: string[];
  active_components: string[];
  form: Product["form"];
  volume: string;
  description: string;
  rating: number;
  reviews_count: number;
  in_stock: boolean;
  stock_quantity: number | null;
  is_hit: boolean;
  accent: Product["accent"];
  image_url: string | null;
}

function mapProductRow(row: ProductRow): Product {
  // stock_quantity — новая колонка, может быть ещё не заполнена для старых
  // товаров. Пока админ не проставил число, доверяем старому булеву in_stock
  // (999 «в достатке» / 0 «нет»), чтобы каталог не «обнулился» после миграции.
  const stockQuantity = row.stock_quantity ?? (row.in_stock ? 999 : 0);

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    price: row.price,
    oldPrice: row.old_price ?? undefined,
    ageGroup: row.age_group,
    purposes: row.purposes ?? [],
    activeComponents: row.active_components ?? [],
    form: row.form,
    volume: row.volume,
    description: row.description,
    rating: row.rating,
    reviewsCount: row.reviews_count,
    inStock: stockQuantity > 0,
    stockQuantity,
    isHit: row.is_hit,
    accent: row.accent,
    imageUrl: row.image_url ?? undefined,
  };
}

interface CatalogDataValue {
  products: Product[];
  purposes: FilterOption[];
  brands: FilterOption[];
  loading: boolean;
  refetch: () => void;
}

const CatalogDataContext = createContext<CatalogDataValue | null>(null);

export function CatalogDataProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [purposes, setPurposes] = useState<FilterOption[]>([]);
  const [brands, setBrands] = useState<FilterOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  const refetch = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      if (!isSupabaseConfigured) {
        // Supabase ещё не подключён (нет .env.local с реальными ключами) —
        // не делаем заведомо бессмысленный запрос, сразу показываем пустой каталог.
        if (!cancelled) {
          setProducts([]);
          setPurposes([]);
          setBrands([]);
          setLoading(false);
        }
        return;
      }

      try {
        const [productsRes, purposesRes, brandsRes] = await Promise.all([
          supabase.from("products").select("*").order("name"),
          supabase.from("purposes").select("slug, label").order("label"),
          supabase.from("brands").select("slug, label").order("label"),
        ]);

        if (cancelled) return;

        setProducts(((productsRes.data as ProductRow[] | null) ?? []).map(mapProductRow));
        setPurposes((purposesRes.data as FilterOption[] | null) ?? []);
        setBrands((brandsRes.data as FilterOption[] | null) ?? []);
      } catch (error) {
        // Supabase недоступен (не настроен .env.local, нет сети и т.п.) —
        // не зависаем на загрузке вечно, просто показываем пустой каталог.
        console.error("Не удалось загрузить каталог из Supabase", error);
        if (cancelled) return;
        setProducts([]);
        setPurposes([]);
        setBrands([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [version]);

  const value = useMemo<CatalogDataValue>(
    () => ({ products, purposes, brands, loading, refetch }),
    [products, purposes, brands, loading, refetch]
  );

  return <CatalogDataContext.Provider value={value}>{children}</CatalogDataContext.Provider>;
}

export function useCatalogData(): CatalogDataValue {
  const ctx = useContext(CatalogDataContext);
  if (!ctx) throw new Error("useCatalogData must be used within a CatalogDataProvider");
  return ctx;
}
