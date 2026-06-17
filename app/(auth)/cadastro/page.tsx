"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function CadastroPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error: err } = await supabase().auth.signUp({ email, password });
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    router.replace("/sem-acesso");
  }

  return (
    <div className="field-bg min-h-screen flex flex-col items-center justify-center px-4">
      <div className="pointer-events-none fixed inset-0 bg-zinc-950/70" />
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
        <div className="w-80 h-80 bg-green-500/15 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm space-y-8 relative">
        <div className="flex flex-col items-center gap-4 animate-scale-in">
          <div className="w-24 h-24 rounded-3xl overflow-hidden ring-2 ring-green-500/40 shadow-2xl shadow-green-900/50">
            <Image src="/icons/icon-192.png" alt="RadarWC" width={96} height={96} className="object-cover" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-black text-white tracking-tight">Criar conta</h1>
            <p className="text-green-400 text-sm font-semibold mt-0.5">FIFA World Cup 2026</p>
            <p className="text-zinc-500 text-xs mt-1">Acesso completo após a compra</p>
          </div>
        </div>

        <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800/80 rounded-2xl p-6 space-y-4 animate-fade-in-up delay-200">
          <form onSubmit={handleRegister} className="space-y-4">
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
                  minLength={6}
                  placeholder="mínimo 6 caracteres"
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
              {loading ? "Criando conta..." : "Criar conta"}
            </button>
          </form>

          <p className="text-center text-sm text-zinc-600 pt-1">
            Já tem conta?{" "}
            <Link href="/login" className="text-green-400 hover:text-green-300 font-semibold transition-colors">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
