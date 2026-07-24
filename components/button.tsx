"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

type Variant = "primary" | "accent" | "white" | "outline" | "outline-dark" | "ghost";
type Size = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-accent-600 text-white hover:bg-accent-700",
  accent:
    "bg-accent-500 text-white hover:bg-accent-600 disabled:bg-zinc-200 disabled:text-zinc-400",
  white: "bg-white text-brand-900 shadow-[0_6px_16px_rgba(15,44,70,0.12)] hover:bg-brand-50",
  outline: "border border-white/40 text-white hover:bg-white/10",
  "outline-dark": "border border-line text-brand-900 hover:bg-brand-50",
  ghost: "text-accent-600 hover:text-accent-700",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "h-9 px-4 text-xs",
  md: "h-11 px-6 text-sm",
  lg: "h-14 px-8 text-base",
};

interface ButtonProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: Variant;
  size?: Size;
  type?: "button" | "submit";
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  ariaLabel?: string;
}

export function Button({
  children,
  href,
  onClick,
  variant = "primary",
  size = "md",
  type = "button",
  disabled = false,
  fullWidth = false,
  className = "",
  ariaLabel,
}: ButtonProps) {
  const isPlain = variant === "ghost";
  const classes = [
    "inline-flex items-center justify-center gap-2 font-semibold transition-colors",
    isPlain ? "rounded-md" : "rounded-full",
    VARIANT_CLASSES[variant],
    isPlain ? "text-sm" : SIZE_CLASSES[size],
    fullWidth ? "w-full" : "",
    disabled ? "cursor-not-allowed" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (href && !disabled) {
    return (
      <motion.div
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
        className={fullWidth ? "block w-full" : "inline-block"}
      >
        <Link href={href} className={classes} aria-label={ariaLabel}>
          {children}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.03 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      className={classes}
      aria-label={ariaLabel}
    >
      {children}
    </motion.button>
  );
}
