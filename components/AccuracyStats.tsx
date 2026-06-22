"use client";

import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import type { AccuracyStat } from "@/lib/accuracy";

interface Props {
  stats: AccuracyStat[];
}

export function AccuracyStats({ stats }: Props) {
  if (stats.length === 0) return null;

  const overall = stats.reduce((acc, s) => ({ correct: acc.correct + s.correct, total: acc.total + s.total }), { correct: 0, total: 0 });
  const overallPct = overall.total > 0 ? Math.round((overall.correct / overall.total) * 100) : 0;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Histórico de Acertos</h3>
        </div>
        <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/25 rounded-full px-3 py-1">
          <span className="text-sm font-black text-green-400">{overallPct}%</span>
          <span className="text-[10px] text-zinc-500">geral</span>
        </div>
      </div>

      {/* Stats por mercado */}
      <div className="space-y-2.5">
        {stats.map((s) => (
          <div key={s.market} className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-zinc-400 truncate max-w-[65%]">{s.market}</span>
              <span className={`font-bold ${s.pct >= 65 ? "text-green-400" : s.pct >= 45 ? "text-yellow-400" : "text-red-400"}`}>
                {s.pct}% <span className="text-zinc-600 font-normal">({s.correct}/{s.total})</span>
              </span>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${s.pct >= 65 ? "bg-green-500" : s.pct >= 45 ? "bg-yellow-500" : "bg-red-500"}`}
                initial={{ width: 0 }}
                whileInView={{ width: `${s.pct}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-zinc-700">Baseado nos jogos já encerrados da Copa 2026</p>
    </div>
  );
}
