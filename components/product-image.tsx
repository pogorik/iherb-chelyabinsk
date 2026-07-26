import { ProductGlyph } from "./product-glyph";
import type { Product } from "@/lib/types";

export function ProductImage({
  product,
  className,
  glyphClassName,
}: {
  product: Product;
  className?: string;
  // Padding applied only to the icon placeholder shown when there's no real
  // photo — real photos fill the frame edge-to-edge instead.
  glyphClassName?: string;
}) {
  if (product.imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- remote S3 host, no next/image domain config needed
    return <img src={product.imageUrl} alt={product.name} className={`object-cover ${className ?? ""}`} />;
  }
  return <ProductGlyph product={product} className={`${className ?? ""} ${glyphClassName ?? ""}`} />;
}
