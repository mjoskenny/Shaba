import { createClient } from "@supabase/supabase-js";

// These public client credentials are safe to ship in browser code. Keep env
// overrides for deployments that intentionally target a different Supabase project.
const defaultSupabaseUrl = "https://xkdkiznlmasseskakjkd.supabase.co";
const defaultSupabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrZGtpem5sbWFzc2Vza2FramtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2MzMzOTUsImV4cCI6MjEwNzIwOTM5NX0.7zxgG9WjBFTyaU8rqHjALzZgwJTKoRCcPyzt0lF4prw";
const configuredSupabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() || defaultSupabaseUrl;
const configuredSupabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() || defaultSupabaseAnonKey;

export const isSupabaseConfigured = Boolean(configuredSupabaseUrl && configuredSupabaseAnonKey);
const supabaseUrl = configuredSupabaseUrl;
export const supabaseAnonKey = configuredSupabaseAnonKey;

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
