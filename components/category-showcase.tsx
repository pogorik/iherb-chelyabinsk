import Link from "next/link";
import Image from "next/image";
import { assetPath } from "@/lib/asset-path";

const CATEGORIES: Array<{
  slug: string;
  label: string;
  hint: string;
  photo: string;
}> = [
  { slug: "immunity", label: "Иммунитет", hint: "Защита организма", photo: "/categories/immunity.jpg" },
  { slug: "vitamins-minerals", label: "Витамины и минералы", hint: "Базовая поддержка", photo: "/categories/vitamins-minerals.jpg" },
  { slug: "sport-energy", label: "Спорт и энергия", hint: "Тонус и восстановление", photo: "/categories/sport-energy.jpg" },
  { slug: "sleep-nervous", label: "Сон и нервная система", hint: "Спокойствие и отдых", photo: "/categories/sleep-nervous.jpg" },
  { slug: "beauty-skin", label: "Красота и кожа", hint: "Кожа, волосы, ногти", photo: "/categories/beauty-skin.jpg" },
  { slug: "joints-bones", label: "Суставы и кости", hint: "Подвижность", photo: "/categories/joints-bones.jpg" },
  { slug: "gut-health", label: "ЖКТ и пищеварение", hint: "Комфорт кишечника", photo: "/categories/gut-health.jpg" },
  { slug: "kids-health", label: "Детское здоровье", hint: "Забота с детства", photo: "/categories/kids-health.jpg" },
];

export function CategoryShowcase() {
  return (
    <section id="highlights" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-brand-900 sm:text-3xl">
            Категории товаров
          </h2>
          <p className="mt-2 max-w-xl text-sm text-zinc-500 sm:text-base">
            Выберите направление — и мы сразу отфильтруем каталог под ваш запрос.
          </p>
        </div>
        <Link
          href="/catalog"
          className="hidden shrink-0 text-sm font-medium text-accent-600 hover:text-accent-700 sm:block"
        >
          Весь каталог →
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {CATEGORIES.map(({ slug, label, hint, photo }) => (
          <Link
            key={slug}
            href={`/catalog?purpose=${slug}`}
            className="group flex flex-col overflow-hidden rounded-[20px] border border-line bg-white transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(15,44,70,0.1)]"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-sand-100">
              <Image
                src={assetPath(photo)}
                alt={label}
                fill
                className="object-cover transition duration-300 group-hover:scale-105"
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              />
            </div>
            <div className="p-4 sm:p-5">
              <p className="text-sm font-semibold text-brand-900">{label}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{hint}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
