export type AgeGroup = "adult" | "kids";

export type ProductForm = "capsules" | "tablets" | "powder" | "liquid" | "gummies";

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  oldPrice?: number;
  ageGroup: AgeGroup;
  purposes: string[];
  activeComponents: string[];
  form: ProductForm;
  volume: string;
  description: string;
  rating: number;
  reviewsCount: number;
  inStock: boolean;
  // Заполняется при загрузке из Supabase (mapProductRow). В статичных
  // сид-данных (lib/products.ts) может отсутствовать.
  stockQuantity?: number;
  isHit?: boolean;
  accent: "brand" | "accent" | "leaf" | "amber" | "berry";
  imageUrl?: string;
  // Все фото товара, imageUrl — это imageUrls[0] для удобства (см. mapProductRow).
  imageUrls?: string[];
}

export interface FilterOption {
  slug: string;
  label: string;
}
