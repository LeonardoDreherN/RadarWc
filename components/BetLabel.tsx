"use client";

import type { BetLabel as BetLabelType, RiskLevel } from "@/lib/analysis";
import { ShieldCheck, Shield, AlertTriangle, Ban } from "lucide-react";

const RISK = {
  baixo: {
    label: "TENDÊNCIA ✦",
    stripe: "bg-green-500",
    border: "border-green-500/40",
    bg: "bg-green-500/8",
    badge: "bg-green-500/20 text-green-400 border-green-500/40",
    bar: "bg-green-500",
    pct: "text-green-400",
    Icon: ShieldCheck,
  },
  medio: {
    label: "MÉDIO RISCO",
    stripe: "bg-yellow-400",
    border: "border-yellow-400/30",
    bg: "bg-yellow-400/5",
    badge: "bg-yellow-400/15 text-yellow-400 border-yellow-400/30",
    bar: "bg-yellow-400",
    pct: "text-yellow-400",
    Icon: Shield,
  },
  alto: {
    label: "ALTO RISCO",
    stripe: "bg-red-500",
    border: "border-red-500/25",
    bg: "bg-red-500/5",
    badge: "bg-red-500/15 text-red-400 border-red-500/25",
    bar: "bg-red-500",
    pct: "text-red-400",
    Icon: AlertTriangle,
  },
  nao_apostar: {
    label: "NÃO APOSTAR",
    stripe: "bg-zinc-600",
    border: "border-zinc-700/50",
    bg: "bg-zinc-900",
    badge: "bg-zinc-700/40 text-zinc-500 border-zinc-600/30",
    bar: "bg-zinc-600",
    pct: "text-zinc-500",
    Icon: Ban,
  },
} satisfies Record<RiskLevel, {
  label: string; stripe: string; border: string; bg: string;
  badge: string; bar: string; pct: string;
  Icon: React.ComponentType<{ className?: string }>;
}>;

interface Props {
  label: BetLabelType;
}

export function BetLabel({ label }: Props) {
  const cfg = RISK[label.risk ?? "alto"];
  const { Icon } = cfg;
  const isNao = label.risk === "nao_apostar";

  return (
    <div className={`relative rounded-xl border ${cfg.border} ${cfg.bg} overflow-hidden`}>
      {/* Barra lateral colorida */}
      <div className={`absolute left-0 top-0 bottom-0 w-0.75 ${cfg.stripe}`} />

      <div className="pl-5 pr-4 py-4 space-y-3">
        {/* Linha topo: mercado + badge de risco */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
            {label.market}
          </span>
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.badge}`}>
            <Icon className="w-2.5 h-2.5" />
            {cfg.label}
          </span>
        </div>

        {/* Sugestão principal */}
        <p className={`text-[15px] font-black leading-snug ${isNao ? "text-zinc-500 line-through" : "text-white"}`}>
          {label.suggestion}
        </p>

        {/* Confiança */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-zinc-600">Confiança estatística</span>
            <span className={`text-sm font-black ${cfg.pct}`}>{label.confidence}%</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-1">
            <div
              className={`h-1 rounded-full ${cfg.bar}`}
              style={{ width: `${label.confidence}%` }}
            />
          </div>
        </div>

        {/* Base da análise */}
        <p className="text-[11px] text-zinc-500 leading-relaxed">{label.basis}</p>
      </div>
    </div>
  );
}
