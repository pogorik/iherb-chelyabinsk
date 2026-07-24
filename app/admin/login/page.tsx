"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { useSiteSettings } from "@/lib/site-settings-context";
import { Button } from "@/components/button";

export default function AdminLoginPage() {
  const router = useRouter();
  const { session, loading, signIn } = useAdminAuth();
  const { settings } = useSiteSettings();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && session) router.replace("/admin");
  }, [loading, session, router]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error: signInError } = await signIn(email, password);
    setSubmitting(false);
    if (signInError) {
      setError("Неверный email или пароль");
      return;
    }
    router.replace("/admin");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sand-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-[28px] border border-line bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)]"
      >
        <p className="font-display text-xl font-semibold text-brand-900">Админка {settings.name}</p>
        <p className="mt-1 text-sm text-zinc-500">Войдите, чтобы управлять сайтом.</p>

        <div className="mt-6 space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-600">Email</span>
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand-400"
              placeholder="you@example.com"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-600">Пароль</span>
            <input
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand-400"
              placeholder="••••••••"
            />
          </label>
        </div>

        {error && <p className="mt-3 text-sm text-accent-600">{error}</p>}

        <Button type="submit" variant="primary" size="lg" fullWidth disabled={submitting} className="mt-6">
          {submitting ? "Входим…" : "Войти"}
        </Button>
      </form>
    </div>
  );
}
