import { Hero } from "@/components/hero";
import { CategoryShowcase } from "@/components/category-showcase";
import { FeaturedProducts } from "@/components/featured-products";

export default function Home() {
  return (
    <>
      <Hero />
      <CategoryShowcase />
      <FeaturedProducts />
    </>
  );
}
