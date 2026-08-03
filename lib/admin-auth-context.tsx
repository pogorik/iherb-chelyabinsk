"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

interface AdminSession {
  email: string;
}

interface AdminAuthValue {
  session: AdminSession | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data: { email: string | null }) => {
        setSession(data.email ? { email: data.email } : null);
      })
      .catch((error) => {
        console.error("Не удалось получить сессию", error);
        setSession(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AdminAuthValue>(
    () => ({
      session,
      loading,
      async signIn(email, password) {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          return { error: data.error ?? "Не удалось войти" };
        }
        const data = await response.json();
        setSession({ email: data.email });
        return { error: null };
      },
      async signOut() {
        await fetch("/api/auth/logout", { method: "POST" });
        setSession(null);
      },
    }),
    [session, loading]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth(): AdminAuthValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  return ctx;
}
