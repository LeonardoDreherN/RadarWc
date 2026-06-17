"use client";

import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Fixture } from "@/lib/football-api";
import { ChevronRight, Radio } from "lucide-react";
import { Countdown } from "./Countdown";

interface Props {
  fixture: Fixture;
  index?: number;
}

export function MatchCard({ fixture: f, index = 0 }: Props) {
  const isLive = ["1H", "HT", "2H", "ET", "P"].includes(f.fixture.status.short);
  const isFinished = ["FT", "AET", "PEN"].includes(f.fixture.status.short);
  const isUpcoming = f.fixture.status.short === "NS";
  const date = new Date(f.fixture.date);

  return (
    <Link href={`/jogo/${f.fixture.id}`}>
      <div
        className={`relative rounded-2xl border overflow-hidden transition-all active:scale-[0.98] animate-fade-in-up ${
          isLive
            ? "border-green-500/40 bg-linear-to-br from-green-950/40 to-zinc-900"
            : "border-zinc-800/60 bg-zinc-900/80 hover:border-zinc-700"
        }`}
        style={{ animationDelay: `${index * 0.06}s` }}
      >
        {isLive && <div className="absolute inset-0 bg-green-500/3 pointer-events-none" />}

        <div className="p-4 space-y-3">
          {/* Topo: rodada + status/hora */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-600 font-medium uppercase tracking-wider">
              {f.league.round}
            </span>
            {isLive ? (
              <div className="flex items-center gap-1.5 bg-green-500/15 border border-green-500/30 rounded-full px-2.5 py-1">
                <Radio className="w-2.5 h-2.5 text-green-400 animate-pulse" />
                <span className="text-[10px] text-green-400 font-black">
                  AO VIVO {f.fixture.status.elapsed ? `${f.fixture.status.elapsed}'` : ""}
                </span>
              </div>
            ) : isFinished ? (
              <span className="text-[10px] text-zinc-600 bg-zinc-800 rounded-full px-2.5 py-1">Encerrado</span>
            ) : (
              <div className="flex items-center gap-3">
                {isUpcoming && <Countdown date={f.fixture.date} />}
                <span className="text-[10px] text-zinc-500 font-medium">
                  {format(date, "dd/MM · HH'h'mm", { locale: ptBR })}
                </span>
              </div>
            )}
          </div>

          {/* Times + placar */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="w-10 h-10 relative shrink-0">
                <Image src={f.teams.home.logo} alt={f.teams.home.name} fill className="object-contain" sizes="40px" />
              </div>
              <span className={`text-sm font-bold leading-tight truncate ${
                isFinished && f.teams.home.winner === true ? "text-white" :
                isFinished ? "text-zinc-500" : "text-zinc-200"
              }`}>
                {f.teams.home.name}
              </span>
            </div>

            <div className="flex flex-col items-center shrink-0 w-16">
              {f.goals.home !== null ? (
                <span className={`text-xl font-black tracking-tight ${isLive ? "text-green-300 score-pulse" : "text-white"}`}>
                  {f.goals.home} – {f.goals.away}
                </span>
              ) : (
                <span className="text-xs text-zinc-600 font-bold bg-zinc-800 rounded-lg px-3 py-1.5">VS</span>
              )}
            </div>

            <div className="flex items-center gap-2.5 flex-1 min-w-0 flex-row-reverse">
              <div className="w-10 h-10 relative shrink-0">
                <Image src={f.teams.away.logo} alt={f.teams.away.name} fill className="object-contain" sizes="40px" />
              </div>
              <span className={`text-sm font-bold leading-tight truncate text-right ${
                isFinished && f.teams.away.winner === true ? "text-white" :
                isFinished ? "text-zinc-500" : "text-zinc-200"
              }`}>
                {f.teams.away.name}
              </span>
            </div>
          </div>

          {/* Rodapé */}
          <div className="flex items-center justify-between pt-0.5">
            <span className="text-[10px] text-zinc-700 truncate max-w-[70%]">
              {f.fixture.venue.name}
            </span>
            <div className="flex items-center gap-1 text-zinc-600">
              <span className="text-[10px] font-medium">Ver análise</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
