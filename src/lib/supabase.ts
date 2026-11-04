import { createClient } from "@supabase/supabase-js";

const configuredSupabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const configuredSupabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

export const isSupabaseConfigured = Boolean(configuredSupabaseUrl && configuredSupabaseAnonKey);
const supabaseUrl = configuredSupabaseUrl || "http://127.0.0.1:54321";
export const supabaseAnonKey = configuredSupabaseAnonKey || "local-development-key-not-configured";

export function assertSupabaseConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable store operations.");
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const apiBase = configuredSupabaseUrl
  ? `${configuredSupabaseUrl.replace(/\/$/, "")}/functions/v1/make-server-16e069d6`
  : "";
