import { createClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

const MAX_AGE = 60 * 60 * 24 * 365;
const LS_PREFIX = "_sb_";

function getCookieValue(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  for (const part of document.cookie.split("; ")) {
    const [k, ...v] = part.split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return undefined;
}

// Cliente browser — lê de localStorage (persiste no iOS PWA) e sincroniza para cookie (para o middleware SSR)
export function supabase() {
  if (typeof window === "undefined") return createBrowserClient(url, anon);

  return createBrowserClient(url, anon, {
    cookies: {
      get(name) {
        return localStorage.getItem(LS_PREFIX + name) ?? getCookieValue(name);
      },
      set(name, value) {
        localStorage.setItem(LS_PREFIX + name, value);
        document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${MAX_AGE}; SameSite=Lax`;
      },
      remove(name) {
        localStorage.removeItem(LS_PREFIX + name);
        document.cookie = `${name}=; path=/; max-age=0`;
      },
    },
  });
}

// Cliente servidor — usa service role, sem cookies
export function supabaseAdmin() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? anon;
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
