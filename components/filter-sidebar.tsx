"use client";

import { CheckIcon } from "./icons";
import { FilterCheckboxGroup } from "./filter-checkbox-group";
import { PriceRangeSlider } from "./price-range-slider";
import { Button } from "./button";
import { ACTIVE_COMPONENTS } from "@/lib/products";
import type { AgeGroup, FilterOption } from "@/lib/types";

export interface FilterSidebarProps {
  ageGroup: AgeGroup | "all";
  setAgeGroup: (value: AgeGroup | "all") => void;
  saleOnly: boolean;
  setSaleOnly: (value: boolean) => void;
  purposeOptions: FilterOption[];
  purposes: string[];
  togglePurpose: (slug: string) => void;
  components: string[];
  toggleComponent: (slug: string) => void;
  brandOptions: FilterOption[];
  brands: string[];
  toggleBrand: (slug: string) => void;
  priceMin: number;
  priceMax: number;
  priceRange: [number, number];
  setPriceRange: (value: [number, number]) => void;
  inStockOnly: boolean;
  setInStockOnly: (value: boolean) => void;
  onReset: () => void;
}

const AGE_TABS: Array<{ key: AgeGroup | "all" | "sale"; label: string }> = [
  { key: "all", label: "Все" },
  { key: "adult", label: "Взрослые" },
  { key: "kids", label: "Дети" },
  { key: "sale", label: "SALE" },
];

export function FilterSidebar({
  ageGroup,
  setAgeGroup,
  saleOnly,
  setSaleOnly,
  purposeOptions,
  purposes,
  togglePurpose,
  components,
  toggleComponent,
  brandOptions,
  brands,
  toggleBrand,
  priceMin,
  priceMax,
  priceRange,
  setPriceRange,
  inStockOnly,
  setInStockOnly,
  onReset,
}: FilterSidebarProps) {
  return (
    <div>
      <div className="flex flex-wrap gap-2 pb-4">
        {AGE_TABS.map((tab) => {
          const active = tab.key === "sale" ? saleOnly : ageGroup === tab.key && !saleOnly;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                if (tab.key === "sale") {
                  setSaleOnly(!saleOnly);
                } else {
                  setAgeGroup(tab.key);
                  setSaleOnly(false);
                }
              }}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                active ? "bg-brand-900 text-white" : "bg-sand-100 text-brand-700 hover:bg-sand-200"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <FilterCheckboxGroup title="Назначение" options={purposeOptions} selected={purposes} onToggle={togglePurpose} />
      <FilterCheckboxGroup
        title="Активный компонент"
        options={ACTIVE_COMPONENTS}
        selected={components}
        onToggle={toggleComponent}
      />
      <FilterCheckboxGroup title="Бренд" options={brandOptions} selected={brands} onToggle={toggleBrand} collapsedCount={6} />

      <div className="border-b border-line py-4">
        <p className="text-sm font-semibold text-brand-900">Цена</p>
        <div className="mt-4">
          <PriceRangeSlider min={priceMin} max={priceMax} step={10} value={priceRange} onChange={setPriceRange} />
        </div>
      </div>

      <div className="py-4">
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-zinc-600">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={inStockOnly}
            onChange={(event) => setInStockOnly(event.target.checked)}
          />
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-zinc-300 text-transparent peer-checked:border-brand-600 peer-checked:bg-brand-600 peer-checked:text-white">
            <CheckIcon className="h-3 w-3" />
          </span>
          Только товары в наличии
        </label>
      </div>

      <Button variant="ghost" onClick={onReset} className="mt-2 !px-0">
        Сбросить фильтры
      </Button>
    </div>
  );
}
