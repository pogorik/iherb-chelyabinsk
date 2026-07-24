import type { Product } from "@/lib/types";

const PALETTE: Record<Product["accent"], { cap: string; label: string; labelSoft: string }> = {
  brand: { cap: "#1c4a6f", label: "#2f74a8", labelSoft: "#bcdcf0" },
  accent: { cap: "#26631d", label: "#3e9e2f", labelSoft: "#c7e8bf" },
  leaf: { cap: "#2f5f3c", label: "#4f9760", labelSoft: "#c3e6ca" },
  amber: { cap: "#93600f", label: "#c98a26", labelSoft: "#f2d69a" },
  berry: { cap: "#7c2c48", label: "#b8446c", labelSoft: "#f0c3d4" },
};

function FormMark({ form, color }: { form: Product["form"]; color: string }) {
  switch (form) {
    case "liquid":
      return <path d="M0 6c2-2 4-2 6 0s4 2 6 0" stroke={color} strokeWidth={1.4} fill="none" strokeLinecap="round" transform="translate(0 0)" />;
    case "powder":
      return (
        <g fill={color}>
          <circle cx="-4" cy="0" r="1.4" />
          <circle cx="1" cy="3" r="1.4" />
          <circle cx="5" cy="-2" r="1.4" />
        </g>
      );
    case "gummies":
      return <path d="M-5 3 Q0 -6 5 3 Q0 8 -5 3Z" fill={color} opacity={0.9} />;
    case "tablets":
      return <circle cx="0" cy="0" r="5" fill="none" stroke={color} strokeWidth={1.4} />;
    case "capsules":
    default:
      return (
        <g transform="rotate(-30)">
          <rect x="-8" y="-3" width="16" height="6" rx="3" fill="none" stroke={color} strokeWidth={1.4} />
          <path d="M0 -3v6" stroke={color} strokeWidth={1.4} />
        </g>
      );
  }
}

export function ProductGlyph({ product, className }: { product: Product; className?: string }) {
  const palette = PALETTE[product.accent];
  return (
    <svg viewBox="0 0 120 120" className={className} role="img" aria-label={product.name}>
      <ellipse cx="60" cy="104" rx="30" ry="5" fill="#000" opacity="0.06" />
      {/* jar body */}
      <rect x="34" y="40" width="52" height="58" rx="10" fill="#ffffff" stroke="#d8dde3" strokeWidth="1.5" />
      {/* label band */}
      <rect x="34" y="62" width="52" height="22" fill={palette.label} />
      <rect x="34" y="62" width="52" height="3" fill={palette.labelSoft} opacity="0.6" />
      {/* cap */}
      <rect x="42" y="24" width="36" height="18" rx="4" fill={palette.cap} />
      <rect x="42" y="24" width="36" height="5" rx="2.5" fill="#ffffff" opacity="0.18" />
      {/* form icon inside label */}
      <g transform="translate(60 73)" color={palette.labelSoft}>
        <FormMark form={product.form} color="#ffffff" />
      </g>
    </svg>
  );
}
