import { cookies } from "next/headers";
import { getIronSession, type IronSession } from "iron-session";

export interface AdminSessionData {
  userId?: string;
  email?: string;
}

if (!process.env.SESSION_SECRET) {
  // Не бросаем на этапе импорта во время сборки статики/типов — но без этого
  // переменного окружения на сервере вход в админку работать не будет.
  console.warn("SESSION_SECRET не задан — сессии админки не будут работать.");
}

const sessionOptions = {
  password: process.env.SESSION_SECRET ?? "dev-only-insecure-secret-change-me-32chars",
  cookieName: "iherb_admin_session",
  cookieOptions: {
    // По умолчанию выключено — сайт пока без HTTPS. Включить (COOKIE_SECURE=true)
    // после того как будет настроен домен и SSL-сертификат.
    secure: process.env.COOKIE_SECURE === "true",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 30, // 30 дней
  },
};

export async function getSession(): Promise<IronSession<AdminSessionData>> {
  return getIronSession<AdminSessionData>(await cookies(), sessionOptions);
}

export async function requireAdmin(): Promise<AdminSessionData | null> {
  const session = await getSession();
  return session.userId ? session : null;
}
