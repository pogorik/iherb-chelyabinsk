"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { siteConfig as fallbackConfig } from "./config";

export interface SiteSettings {
  name: string;
  tagline: string;
  heroTitle: string;
  heroSubtitle: string;
  phone: string;
  phoneHref: string;
  whatsappNumber: string;
  telegramUsername: string;
  maxHref: string;
  email: string;
  address: string;
  workingHours: string;
  vkUrl: string;
  pickupInfo: string;
}

interface SettingsRow {
  name: string;
  tagline: string;
  hero_title: string;
  hero_subtitle: string;
  phone: string;
  phone_href: string;
  whatsapp_number: string;
  telegram_username: string;
  max_href: string;
  email: string;
  address: string;
  working_hours: string;
  vk_url: string;
  pickup_info: string;
}

const FALLBACK_SETTINGS: SiteSettings = {
  name: fallbackConfig.name,
  tagline: fallbackConfig.tagline,
  heroTitle: fallbackConfig.name,
  heroSubtitle:
    "Витамины, минералы и БАДы для иммунитета, энергии и красоты.",
  phone: fallbackConfig.phone,
  phoneHref: fallbackConfig.phoneHref,
  whatsappNumber: fallbackConfig.whatsappNumber,
  telegramUsername: fallbackConfig.telegramUsername,
  maxHref: fallbackConfig.maxHref,
  email: fallbackConfig.email,
  address: fallbackConfig.address,
  workingHours: fallbackConfig.workingHours,
  vkUrl: fallbackConfig.vkUrl,
  pickupInfo: fallbackConfig.pickupInfo,
};

function mapSettingsRow(row: SettingsRow): SiteSettings {
  return {
    name: row.name,
    tagline: row.tagline,
    heroTitle: row.hero_title,
    heroSubtitle: row.hero_subtitle,
    phone: row.phone,
    phoneHref: row.phone_href,
    whatsappNumber: row.whatsapp_number,
    telegramUsername: row.telegram_username,
    maxHref: row.max_href,
    email: row.email,
    address: row.address,
    workingHours: row.working_hours,
    vkUrl: row.vk_url,
    pickupInfo: row.pickup_info,
  };
}

interface SiteSettingsValue {
  settings: SiteSettings;
  loading: boolean;
  refetch: () => void;
}

const SiteSettingsContext = createContext<SiteSettingsValue | null>(null);

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(FALLBACK_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  const refetch = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      try {
        const response = await fetch("/api/site-settings");
        if (cancelled) return;
        if (response.ok) {
          const data = (await response.json()) as SettingsRow | null;
          if (data) setSettings(mapSettingsRow(data));
        }
      } catch (error) {
        // Backend недоступен — остаёмся на статичном фолбэке из lib/config.ts.
        console.error("Не удалось загрузить настройки сайта", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [version]);

  const value = useMemo<SiteSettingsValue>(
    () => ({ settings, loading, refetch }),
    [settings, loading, refetch]
  );

  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings(): SiteSettingsValue {
  const ctx = useContext(SiteSettingsContext);
  if (!ctx) throw new Error("useSiteSettings must be used within a SiteSettingsProvider");
  return ctx;
}
