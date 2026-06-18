import { createClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// Cliente browser — usa cookies via @supabase/ssr para que o proxy consiga ler a sessão
export function supabase() {
  return createBrowserClient(url, anon, {
    cookieOptions: {
      maxAge: 60 * 60 * 24 * 365, // 1 ano — evita logout ao fechar o app
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
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
