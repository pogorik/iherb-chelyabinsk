import { ProductGlyph } from "./product-glyph";
import type { Product } from "@/lib/types";

export function ProductImage({ product, className }: { product: Product; className?: string }) {
  if (product.imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- static export + Supabase Storage host, no next/image config needed
    return <img src={product.imageUrl} alt={product.name} className={`object-cover ${className ?? ""}`} />;
  }
  return <ProductGlyph product={product} className={className} />;
}
