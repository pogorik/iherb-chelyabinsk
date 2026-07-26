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
  image_urls: string[] | null;
}

function mapProductRow(row: ProductRow): Product {
  const stockQuantity = row.stock_quantity ?? (row.in_stock ? 999 : 0);
  const imageUrls = row.image_urls && row.image_urls.length > 0 ? row.image_urls : row.image_url ? [row.image_url] : [];

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
    imageUrl: imageUrls[0] ?? undefined,
    imageUrls,
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

      try {
        const [productsRes, purposesRes, brandsRes] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/taxonomy/purposes"),
          fetch("/api/taxonomy/brands"),
        ]);

        if (cancelled) return;

        const [productRows, purposeRows, brandRows] = await Promise.all([
          productsRes.ok ? (productsRes.json() as Promise<ProductRow[]>) : Promise.resolve([]),
          purposesRes.ok ? (purposesRes.json() as Promise<FilterOption[]>) : Promise.resolve([]),
          brandsRes.ok ? (brandsRes.json() as Promise<FilterOption[]>) : Promise.resolve([]),
        ]);

        if (cancelled) return;

        setProducts(productRows.map(mapProductRow));
        setPurposes(purposeRows);
        setBrands(brandRows);
      } catch (error) {
        // Backend недоступен (нет сети и т.п.) — не зависаем на загрузке вечно,
        // просто показываем пустой каталог.
        console.error("Не удалось загрузить каталог", error);
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
