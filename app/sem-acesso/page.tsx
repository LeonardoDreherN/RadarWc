"use client";

import Link from "next/link";
import Image from "next/image";
import { ExternalLink, Check, Lock, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { BolaoPot } from "@/components/BolaoPot";

const KIWIFY_URL = process.env.NEXT_PUBLIC_KIWIFY_URL ?? "#";

const BENEFITS = [
  "Todas as análises da Copa",
  "Estatísticas completas por jogo",
  "Tendências por mercado",
  "Participação no Bolão Oficial",
  "Liberação imediata",
];

export default function SemAcessoPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [potCount, setPotCount] = useState(0);
  const [potLoaded, setPotLoaded] = useState(false);

  useEffect(() => {
    supabase().auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
    fetch("/api/bolao/pot")
      .then((r) => r.json())
      .then(({ count }) => { setPotCount(count); setPotLoaded(true); })
      .catch(() => setPotLoaded(true));
  }, []);

  return (
    <div className="field-bg min-h-screen flex flex-col items-center justify-center px-4 py-10">
      <div className="pointer-events-none fixed inset-0 bg-zinc-950/80" />
      <div className="pointer-events-none fixed inset-0 flex items-start justify-center pt-20">
        <div className="w-96 h-96 bg-green-500/10 rounded-full blur-3xl" />
      </div>
      <div className="pointer-events-none fixed inset-0 flex items-end justify-center pb-20">
        <div className="w-72 h-72 bg-yellow-500/8 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm space-y-5 relative">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <Image src="/icons/icon-512.png" alt="RadarWC" width={72} height={72} className="object-contain drop-shadow-2xl" />
        </div>

        {/* Card principal */}
        <div className="rounded-2xl border border-zinc-700/60 bg-zinc-900 overflow-hidden shadow-2xl">

          {/* Header */}
          <div className="bg-linear-to-r from-green-700 to-green-600 px-5 py-4 text-center space-y-0.5">
            <p className="text-[10px] text-green-200 font-bold uppercase tracking-widest">Copa do Mundo 2026</p>
            <h1 className="text-base font-black text-white">🏆 Desbloqueie o Acesso Completo</h1>
          </div>

          <div className="p-5 space-y-5">
            {/* Preço */}
            <div className="text-center space-y-0.5">
              <div className="flex items-end justify-center gap-2">
                <span className="text-5xl font-black text-white">R$17,90</span>
              </div>
              <p className="text-xs text-zinc-500">Pagamento único até o fim da Copa</p>
            </div>

            {/* Benefícios */}
            <ul className="space-y-2">
              {BENEFITS.map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-zinc-300">
                  <div className="w-4 h-4 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 text-green-400" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>

            {/* Pot do Bolão — urgência */}
            {potLoaded && (
              <div className="rounded-xl bg-yellow-500/8 border border-yellow-500/25 px-4 py-3 space-y-1.5">
                <p className="text-[10px] text-yellow-400/80 font-bold uppercase tracking-widest text-center">
                  🏆 Prêmio atual do Bolão
                </p>
                <div className="flex justify-center">
                  <BolaoPot initialCount={potCount} />
                </div>
                <p className="text-[10px] text-zinc-600 text-center">
                  A cada nova assinatura o prêmio aumenta
                </p>
              </div>
            )}

            {/* CTA */}
            <a
              href={KIWIFY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-green-600 hover:bg-green-500 active:bg-green-700 text-white font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-900/50 text-base active:scale-95"
            >
              🚀 Liberar meu acesso
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Garantias */}
            <div className="flex items-center justify-center gap-5 text-[11px] text-zinc-500">
              <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Pagamento seguro</span>
              <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Liberação automática</span>
            </div>

            {/* Email warning */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3 text-center space-y-1">
              <p className="text-[11px] text-yellow-400 font-bold uppercase tracking-wide">⚠ Use este e-mail no checkout</p>
              <p className="text-sm text-white font-mono break-all">{email ?? "carregando..."}</p>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-zinc-600">
          Já comprou?{" "}
          <Link href="/login" className="text-green-400 hover:text-green-300 font-medium transition-colors">
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  );
}
