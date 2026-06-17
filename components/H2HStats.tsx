"use client";

import type { H2HSummary } from "@/lib/analysis";

interface Props {
  summary: H2HSummary;
  homeName: string;
  awayName: string;
}

export function H2HStats({ summary, homeName, awayName }: Props) {
  if (summary.total === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-center text-sm text-zinc-500">
        Sem confrontos diretos na Copa do Mundo
      </div>
    );
  }

  const homeW = summary.homeWins;
  const awayW = summary.awayWins;
  const draws = summary.draws;
  const total = summary.total;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-4">
      <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
        Histórico H2H — Copa do Mundo
      </h3>

      {/* Barra proporcional */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-zinc-400">
          <span>{homeName}</span>
          <span>{awayName}</span>
        </div>
        <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
          <div
            className="bg-blue-500 transition-all"
            style={{ width: `${(homeW / total) * 100}%` }}
          />
          <div
            className="bg-zinc-600 transition-all"
            style={{ width: `${(draws / total) * 100}%` }}
          />
          <div
            className="bg-orange-500 transition-all"
            style={{ width: `${(awayW / total) * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-xs font-bold">
          <span className="text-blue-400">{homeW}V</span>
          <span className="text-zinc-500">{draws}E</span>
          <span className="text-orange-400">{awayW}V</span>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-3">
        <Metric label="Média de gols" value={summary.avgGoals.toString()} />
        <Metric
          label="Ambas marcaram"
          value={`${summary.bttsCount}/${total}`}
        />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-zinc-800/60 rounded-lg p-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="text-lg font-black text-white">{value}</p>
    </div>
  );
}
