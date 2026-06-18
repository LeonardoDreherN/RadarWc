import Link from "next/link";
import Image from "next/image";
import { ExternalLink, Check, Trophy } from "lucide-react";

const KIWIFY_URL = process.env.NEXT_PUBLIC_KIWIFY_URL ?? "#";

export default function SemAcessoPage() {
  return (
    <div className="field-bg min-h-screen flex flex-col items-center justify-center px-4 py-10">
      <div className="pointer-events-none fixed inset-0 bg-zinc-950/75" />
      <div className="pointer-events-none fixed inset-0 flex items-start justify-center pt-20">
        <div className="w-80 h-80 bg-green-500/15 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm space-y-6 relative">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <Image src="/icons/icon-512.png" alt="RadarWC" width={120} height={120} className="object-contain drop-shadow-2xl" />
        </div>

        {/* Card de compra */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
          {/* Faixa topo */}
          <div className="bg-gradient-to-r from-green-700 to-green-600 px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-green-100" />
              <span className="text-sm font-black text-white">Acesso Completo</span>
            </div>
            <span className="text-xs text-green-200 font-medium">Copa 2026</span>
          </div>

          <div className="p-5 space-y-5">
            {/* Preço */}
            <div>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-black text-white">R$ 17,90</span>
                <span className="text-zinc-500 text-sm mb-1">pagamento único</span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">Válido até o final da Copa do Mundo 2026</p>
            </div>

            {/* Benefícios */}
            <ul className="space-y-2.5">
              {[
                "Todos os jogos com análise completa",
                "Tendências por mercado: gols, cartões, escanteios",
                "Risco calculado: baixo, médio e alto",
                "Placar ao vivo com atualização automática",
                "Confronto direto (H2H) e forma recente",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-zinc-300">
                  <div className="w-4 h-4 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-2.5 h-2.5 text-green-400" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>

            {/* CTA */}
            <a
              href={KIWIFY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-green-600 hover:bg-green-500 active:bg-green-700 text-white font-black py-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-900/40 text-base"
            >
              Comprar agora — R$ 17,90
              <ExternalLink className="w-4 h-4" />
            </a>

            <p className="text-[11px] text-zinc-600 text-center">
              Use o mesmo e-mail do cadastro no checkout
            </p>
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
