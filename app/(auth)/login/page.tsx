"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Tenta restaurar sessão do localStorage (iOS PWA não persiste cookies)
  useEffect(() => {
    const key = Object.keys(localStorage).find((k) => k.startsWith("_sb_sb-"));
    if (!key) return;
    try {
      const stored = JSON.parse(localStorage.getItem(key)!);
      if (!stored?.access_token || !stored?.refresh_token) return;
      supabase().auth.setSession({
        access_token: stored.access_token,
        refresh_token: stored.refresh_token,
      }).then(({ data }) => {
        if (data.session) router.replace("/dashboard");
      });
    } catch {}
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error: err } = await supabase().auth.signInWithPassword({ email, password });
    if (err) {
      setError("E-mail ou senha incorretos.");
      setLoading(false);
      return;
    }
    router.replace("/dashboard");
  }

  return (
    <div className="field-bg min-h-screen flex flex-col items-center justify-center px-4">
      {/* Overlay escuro para legibilidade */}
      <div className="pointer-events-none fixed inset-0 bg-zinc-950/70" />
      {/* Glow verde central */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
        <div className="w-80 h-80 bg-green-500/15 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm space-y-8 relative">
        {/* Logo animada */}
        <div className="flex flex-col items-center animate-scale-in">
          <Image src="/icons/icon-512.png" alt="RadarWC" width={160} height={160} className="object-contain drop-shadow-2xl" />
        </div>

        {/* Card do form */}
        <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800/80 rounded-2xl p-6 space-y-4 animate-fade-in-up delay-200">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
                className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-green-500/60 focus:ring-1 focus:ring-green-500/20 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Senha</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-green-500/60 focus:ring-1 focus:ring-green-500/20 transition-all pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-500 active:bg-green-700 disabled:opacity-50 text-white font-black py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-900/40 mt-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <p className="text-center text-sm text-zinc-600 pt-1">
            Não tem acesso?{" "}
            <Link href="/cadastro" className="text-green-400 hover:text-green-300 font-semibold transition-colors">
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
