import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// В деве без .env.local и до первого деплоя с секретами переменные могут быть
// пустыми — подставляем валидный, но нерабочий URL, чтобы createClient не падал
// при импорте модуля. Реальные запросы в этом случае просто вернут ошибку сети,
// которую вызывающий код (провайдеры) обрабатывает как пустые данные.
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key"
);
