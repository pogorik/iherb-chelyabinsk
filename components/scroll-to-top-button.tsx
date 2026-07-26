"use client";

import { useEffect, useState } from "react";
import { ChevronDownIcon } from "./icons";

export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setVisible(window.scrollY > 400);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Наверх"
      className="fixed bottom-5 right-5 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-accent-600 text-white shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition hover:bg-accent-700 md:hidden"
    >
      <ChevronDownIcon className="h-5 w-5 rotate-180" />
    </button>
  );
}
