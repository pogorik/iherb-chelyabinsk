import { ProductForm } from "@/components/admin/product-form";

export default function NewProductPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-brand-900">Новый товар</h1>
      <div className="mt-6">
        <ProductForm />
      </div>
    </div>
  );
}
