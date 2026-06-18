import Link from "next/link";
import Image from "next/image";
import { Check } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="field-bg min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="pointer-events-none fixed inset-0 bg-zinc-950/75" />
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
        <div className="w-96 h-96 bg-green-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm space-y-8 relative">
        {/* Logo + título */}
        <div className="flex flex-col items-center text-center gap-2">
          <Image src="/icons/icon-512.png" alt="RadarWC" width={120} height={120} className="object-contain drop-shadow-2xl" />
          <h1 className="text-4xl font-black text-white tracking-tight mt-2">RadarWC</h1>
          <p className="text-green-400 font-semibold text-sm">FIFA World Cup 2026</p>
          <p className="text-zinc-400 text-sm max-w-xs mt-1">
            Análise inteligente para apostadores. Veja tendências, riscos e estatísticas de cada jogo da Copa.
          </p>
        </div>

        {/* Benefícios */}
        <ul className="space-y-3">
          {[
            "Análise completa de todos os jogos",
            "Mercados: gols, cartões, escanteios e mais",
            "Risco calculado: baixo, médio e alto",
            "Placar ao vivo com atualização automática",
            "Confronto direto (H2H) e forma recente",
          ].map((item) => (
            <li key={item} className="flex items-center gap-3 text-sm text-zinc-300">
              <div className="w-5 h-5 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 text-green-400" />
              </div>
              {item}
            </li>
          ))}
        </ul>

        {/* Preço + CTAs */}
        <div className="space-y-3">
          <div className="text-center">
            <span className="text-3xl font-black text-white">R$ 17,90</span>
            <span className="text-zinc-500 text-sm ml-2">acesso completo</span>
          </div>

          <Link
            href="/cadastro"
            className="w-full bg-green-600 hover:bg-green-500 active:bg-green-700 text-white font-black py-4 rounded-xl transition-colors flex items-center justify-center shadow-lg shadow-green-900/40 text-base"
          >
            Começar agora
          </Link>

          <Link
            href="/login"
            className="w-full bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center text-sm border border-zinc-700/60"
          >
            Já tenho conta
          </Link>
        </div>
      </div>
    </div>
  );
}
