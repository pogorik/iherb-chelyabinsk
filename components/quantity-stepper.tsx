"use client";

import { MinusIcon, PlusIcon } from "./icons";

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max,
  size = "md",
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
}) {
  const pad = size === "sm" ? "p-1.5" : "p-2";
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const atMax = typeof max === "number" && value >= max;

  return (
    <div className="inline-flex items-center rounded-full border border-brand-100">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className={`${pad} text-brand-700 transition hover:text-accent-600`}
        aria-label="Уменьшить количество"
      >
        <MinusIcon className={iconSize} />
      </button>
      <span className="w-6 text-center text-sm font-medium text-brand-900">{value}</span>
      <button
        type="button"
        disabled={atMax}
        onClick={() => onChange(typeof max === "number" ? Math.min(max, value + 1) : value + 1)}
        className={`${pad} text-brand-700 transition hover:text-accent-600 disabled:cursor-not-allowed disabled:text-zinc-300 disabled:hover:text-zinc-300`}
        aria-label="Увеличить количество"
      >
        <PlusIcon className={iconSize} />
      </button>
    </div>
  );
}
