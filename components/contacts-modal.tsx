"use client";

import { CloseIcon, MaxIcon, PhoneIcon, TelegramIcon, VkIcon, WhatsAppIcon } from "./icons";
import { useSiteSettings } from "@/lib/site-settings-context";
import { buildWhatsAppLink } from "@/lib/order";

export function ContactsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { settings } = useSiteSettings();

  if (!isOpen) return null;

  const contactChips = [
    { href: settings.phoneHref, label: settings.phone, icon: PhoneIcon },
    { href: settings.maxHref, label: "MAX", icon: MaxIcon },
    { href: `https://t.me/${settings.telegramUsername}`, label: "Telegram", icon: TelegramIcon },
    {
      href: buildWhatsAppLink("Здравствуйте!", settings.whatsappNumber),
      label: "WhatsApp",
      icon: WhatsAppIcon,
    },
    ...(settings.vkUrl
      ? [{ href: settings.vkUrl, label: "Группа в ВКонтакте", icon: VkIcon }]
      : []),
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-brand-950/50 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[28px] border border-line bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)] sm:rounded-[28px]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line p-4">
          <p className="text-sm font-medium text-brand-900">Контакты и пункты выдачи</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-zinc-500 transition hover:bg-zinc-100"
            aria-label="Закрыть"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap gap-2">
            {contactChips.map(({ href, label, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith("tel:") ? undefined : "_blank"}
                rel={href.startsWith("tel:") ? undefined : "noopener noreferrer"}
                className="flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-sm font-medium text-brand-800 transition hover:-translate-y-0.5 hover:bg-brand-50"
              >
                <Icon className="h-4 w-4" />
                {label}
              </a>
            ))}
          </div>

          {settings.pickupInfo && (
            <div className="mt-5 whitespace-pre-line rounded-2xl border border-line bg-sand-50 p-4 text-sm leading-relaxed text-zinc-700">
              {settings.pickupInfo}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
