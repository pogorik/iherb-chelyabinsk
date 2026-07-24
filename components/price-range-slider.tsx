"use client";

import { useCallback, useEffect, useRef } from "react";
import { formatPrice } from "@/lib/utils";

interface PriceRangeSliderProps {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
}

export function PriceRangeSlider({ min, max, step = 10, value, onChange }: PriceRangeSliderProps) {
  const [minVal, maxVal] = value;
  const sliderRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<"min" | "max" | null>(null);

  const percent = useCallback((v: number) => ((v - min) / (max - min || 1)) * 100, [min, max]);

  const handleMove = useCallback(
    (clientX: number) => {
      if (!sliderRef.current || !draggingRef.current) return;
      const rect = sliderRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      const raw = min + (pct / 100) * (max - min);
      const stepped = Math.round(raw / step) * step;
      if (draggingRef.current === "min") {
        onChange([Math.min(stepped, maxVal - step), maxVal]);
      } else {
        onChange([minVal, Math.max(stepped, minVal + step)]);
      }
    },
    [min, max, step, minVal, maxVal, onChange]
  );

  useEffect(() => {
    function onMouseMove(event: MouseEvent) {
      handleMove(event.clientX);
    }
    function onTouchMove(event: TouchEvent) {
      if (event.touches[0]) handleMove(event.touches[0].clientX);
    }
    function onUp() {
      draggingRef.current = null;
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchend", onUp);
    };
  }, [handleMove]);

  const minPct = percent(minVal);
  const maxPct = percent(maxVal);

  return (
    <div>
      <div ref={sliderRef} className="relative h-1.5 w-full rounded-full bg-zinc-200">
        <div
          className="absolute h-1.5 rounded-full bg-brand-500"
          style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }}
        />
        <button
          type="button"
          role="slider"
          aria-label="Минимальная цена"
          aria-valuemin={min}
          aria-valuemax={maxVal}
          aria-valuenow={minVal}
          onMouseDown={() => (draggingRef.current = "min")}
          onTouchStart={() => (draggingRef.current = "min")}
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-brand-600 bg-white shadow"
          style={{ left: `${minPct}%` }}
        />
        <button
          type="button"
          role="slider"
          aria-label="Максимальная цена"
          aria-valuemin={minVal}
          aria-valuemax={max}
          aria-valuenow={maxVal}
          onMouseDown={() => (draggingRef.current = "max")}
          onTouchStart={() => (draggingRef.current = "max")}
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-brand-600 bg-white shadow"
          style={{ left: `${maxPct}%` }}
        />
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
        <span>{formatPrice(minVal)}</span>
        <span>{formatPrice(maxVal)}</span>
      </div>
    </div>
  );
}
