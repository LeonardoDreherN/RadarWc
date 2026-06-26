"use client";

import { motion } from "framer-motion";

interface Entry { name: string; pts: number; isMe: boolean }

interface Props {
  top3: (Entry | null)[];
  anyScored: boolean;
}

const COLORS = {
  0: { bg: "bg-yellow-500", border: "border-yellow-400", text: "text-yellow-400", block: "bg-yellow-500/20 border-yellow-500/30", height: "h-20" },
  1: { bg: "bg-zinc-400", border: "border-zinc-300", text: "text-zinc-300", block: "bg-zinc-700/60 border-zinc-600/40", height: "h-14" },
  2: { bg: "bg-amber-700", border: "border-amber-600", text: "text-amber-500", block: "bg-amber-900/30 border-amber-700/30", height: "h-10" },
};

const MEDALS = ["🥇", "🥈", "🥉"];
const ORDER = [1, 0, 2]; // visual: 2º esq, 1º centro, 3º dir

export function BolaoPodium({ top3, anyScored }: Props) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
      {/* Avatares */}
      <div className="flex items-end justify-center gap-3">
        {ORDER.map((pos, visualIdx) => {
          const entry = top3[pos] ?? null;
          const c = COLORS[pos as 0 | 1 | 2];
          const delay = visualIdx * 0.08;

          return (
            <motion.div
              key={pos}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay, duration: 0.4 }}
              className="flex flex-col items-center gap-1.5 flex-1"
            >
              {/* Avatar */}
              <div className={`relative w-12 h-12 rounded-full border-2 ${c.border} ${entry ? c.bg : "bg-zinc-800 border-zinc-700"} flex items-center justify-center`}>
                {entry ? (
                  <span className="text-lg font-black text-black">
                    {entry.name.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <span className="text-xl">?</span>
                )}
                {pos === 0 && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-base">👑</span>
                )}
              </div>

              {/* Nome */}
              <div className="text-center min-h-[32px] flex flex-col items-center justify-end">
                {entry ? (
                  <>
                    <p className={`text-[11px] font-bold truncate max-w-[72px] ${entry.isMe ? "text-yellow-300" : "text-zinc-300"}`}>
                      {entry.name}{entry.isMe ? " ✦" : ""}
                    </p>
                    {anyScored ? (
                      <p className={`text-xs font-black ${c.text}`}>{entry.pts} pt{entry.pts !== 1 ? "s" : ""}</p>
                    ) : (
                      <p className="text-[10px] text-zinc-600">palpitou</p>
                    )}
                  </>
                ) : (
                  <p className="text-[10px] text-zinc-700">—</p>
                )}
              </div>

              {/* Bloco do pódio */}
              <div className={`w-full ${c.height} rounded-t-xl border ${c.block} flex items-center justify-center`}>
                <span className="text-xl">{MEDALS[pos]}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Status */}
      {!anyScored && (
        <div className="flex items-center justify-center gap-2 pt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse shrink-0" />
          <p className="text-[11px] text-zinc-500 text-center">
            Aguardando as primeiras partidas do mata-mata
          </p>
        </div>
      )}
    </div>
  );
}
