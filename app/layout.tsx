import type { Metadata } from "next";
import { Comfortaa, Inter, Manrope } from "next/font/google";
import "./globals.css";
import { CatalogDataProvider } from "@/lib/catalog-data-context";
import { SiteSettingsProvider } from "@/lib/site-settings-context";
import { siteConfig } from "@/lib/config";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
});

const comfortaa = Comfortaa({
  variable: "--font-comfortaa",
  weight: ["600", "700"],
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: `${siteConfig.name} — ${siteConfig.tagline}`,
  description:
    "Каталог витаминов и БАДов с фильтрами по назначению, активному компоненту и бренду. Демонстрационный сайт-магазин.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${manrope.variable} ${comfortaa.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white text-brand-900">
        <SiteSettingsProvider>
          <CatalogDataProvider>{children}</CatalogDataProvider>
        </SiteSettingsProvider>
      </body>
    </html>
  );
}
