"use client";

import { useState } from "react";
import { CheckIcon, ChevronDownIcon } from "./icons";
import type { FilterOption } from "@/lib/types";

export function FilterCheckboxGroup({
  title,
  options,
  selected,
  onToggle,
  collapsedCount = 6,
}: {
  title: string;
  options: FilterOption[];
  selected: string[];
  onToggle: (slug: string) => void;
  collapsedCount?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? options : options.slice(0, collapsedCount);
  const hasMore = options.length > collapsedCount;

  return (
    <div className="border-b border-line py-4">
      <p className="text-sm font-semibold text-brand-900">{title}</p>
      <ul className="mt-3 space-y-2.5">
        {visible.map((option) => {
          const checked = selected.includes(option.slug);
          return (
            <li key={option.slug}>
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-zinc-600">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={checked}
                  onChange={() => onToggle(option.slug)}
                />
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-zinc-300 text-transparent peer-checked:border-brand-600 peer-checked:bg-brand-600 peer-checked:text-white">
                  <CheckIcon className="h-3 w-3" />
                </span>
                <span className="peer-checked:text-brand-900">{option.label}</span>
              </label>
            </li>
          );
        })}
      </ul>
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-3 flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
        >
          {expanded ? "Свернуть" : "Показать все"}
          <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
      )}
    </div>
  );
}
