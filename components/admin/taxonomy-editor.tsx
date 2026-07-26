"use client";

import { useState } from "react";
import type { FilterOption } from "@/lib/types";

interface TaxonomyEditorProps {
  title: string;
  table: "purposes" | "brands";
  items: FilterOption[];
  onChange: () => void;
}

export function TaxonomyEditor({ title, table, items, onChange }: TaxonomyEditorProps) {
  const [newSlug, setNewSlug] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    if (!newSlug.trim() || !newLabel.trim()) return;
    setError(null);
    setBusySlug("__new__");
    const response = await fetch(`/api/taxonomy/${table}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: newSlug.trim(), label: newLabel.trim() }),
    });
    setBusySlug(null);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Не удалось добавить");
      return;
    }
    setNewSlug("");
    setNewLabel("");
    onChange();
  }

  async function handleRename(slug: string) {
    const label = drafts[slug];
    if (!label || !label.trim()) return;
    setError(null);
    setBusySlug(slug);
    const response = await fetch(`/api/taxonomy/${table}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, label: label.trim() }),
    });
    setBusySlug(null);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Не удалось сохранить");
      return;
    }
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[slug];
      return next;
    });
    onChange();
  }

  async function handleDelete(slug: string, label: string) {
    if (!window.confirm(`Удалить «${label}»? Товары с этим значением его потеряют.`)) return;
    setError(null);
    setBusySlug(slug);
    const response = await fetch(`/api/taxonomy/${table}?slug=${encodeURIComponent(slug)}`, {
      method: "DELETE",
    });
    setBusySlug(null);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Не удалось удалить");
      return;
    }
    onChange();
  }

  return (
    <div className="rounded-[20px] border border-line bg-white p-5">
      <p className="text-sm font-semibold text-brand-900">{title}</p>

      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li key={item.slug} className="flex items-center gap-2">
            <input
              value={drafts[item.slug] ?? item.label}
              onChange={(event) =>
                setDrafts((prev) => ({ ...prev, [item.slug]: event.target.value }))
              }
              className="flex-1 rounded-lg border border-line px-2.5 py-1.5 text-sm outline-none focus:border-brand-400"
            />
            <button
              type="button"
              disabled={busySlug === item.slug || drafts[item.slug] === undefined}
              onClick={() => handleRename(item.slug)}
              className="rounded-full border border-line px-2.5 py-1.5 text-xs font-medium text-brand-900 transition hover:bg-brand-50 disabled:opacity-40"
            >
              Сохранить
            </button>
            <button
              type="button"
              disabled={busySlug === item.slug}
              onClick={() => handleDelete(item.slug, item.label)}
              className="rounded-full border border-line px-2.5 py-1.5 text-xs font-medium text-accent-600 transition hover:bg-accent-50 disabled:opacity-40"
            >
              Удалить
            </button>
          </li>
        ))}
        {items.length === 0 && <p className="text-sm text-zinc-500">Список пуст.</p>}
      </ul>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
        <input
          value={newSlug}
          onChange={(event) => setNewSlug(event.target.value)}
          placeholder="slug (латиницей)"
          className="w-32 rounded-lg border border-line px-2.5 py-1.5 text-sm outline-none focus:border-brand-400"
        />
        <input
          value={newLabel}
          onChange={(event) => setNewLabel(event.target.value)}
          placeholder="Название"
          className="flex-1 rounded-lg border border-line px-2.5 py-1.5 text-sm outline-none focus:border-brand-400"
        />
        <button
          type="button"
          disabled={busySlug === "__new__"}
          onClick={handleAdd}
          className="rounded-full bg-brand-900 px-3.5 py-1.5 text-xs font-medium text-white transition hover:bg-brand-800 disabled:opacity-50"
        >
          Добавить
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-accent-600">{error}</p>}
    </div>
  );
}
