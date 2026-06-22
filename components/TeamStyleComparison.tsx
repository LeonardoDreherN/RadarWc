"use client";

import { motion } from "framer-motion";
import type { TeamStyles } from "@/lib/analysis";

const ATTRS = [
  { key: "ofensivo" as const, label: "Poder Ofensivo", homeColor: "bg-orange-500", awayColor: "bg-orange-400" },
  { key: "defensivo" as const, label: "Solidez Defensiva", homeColor: "bg-blue-500", awayColor: "bg-blue-400" },
  { key: "intensidade" as const, label: "Intensidade", homeColor: "bg-yellow-500", awayColor: "bg-yellow-400" },
  { key: "experiencia" as const, label: "Exp. em Copas", homeColor: "bg-purple-500", awayColor: "bg-purple-400" },
];

interface Props {
  styles: TeamStyles;
  homeName: string;
  awayName: string;
}

export function TeamStyleComparison({ styles, homeName, awayName }: Props) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
        <span className="text-zinc-300 truncate max-w-[38%]">{homeName}</span>
        <span>Estilo</span>
        <span className="text-zinc-300 truncate max-w-[38%] text-right">{awayName}</span>
      </div>

      {/* Barras */}
      <div className="space-y-3">
        {ATTRS.map((attr) => {
          const homeVal = styles.home[attr.key];
          const awayVal = styles.away[attr.key];
          const total = homeVal + awayVal || 1;
          const homePct = Math.round((homeVal / total) * 100);
          const awayPct = 100 - homePct;

          return (
            <div key={attr.key} className="space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-zinc-300">{homeVal}</span>
                <span className="text-zinc-600 text-[9px] uppercase tracking-wider">{attr.label}</span>
                <span className="font-bold text-zinc-300">{awayVal}</span>
              </div>
              <div className="flex h-2 rounded-full overflow-hidden bg-zinc-800">
                <motion.div
                  className={`${attr.homeColor} h-full rounded-l-full`}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${homePct}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                />
                <motion.div
                  className={`${attr.awayColor} h-full rounded-r-full opacity-70`}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${awayPct}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
