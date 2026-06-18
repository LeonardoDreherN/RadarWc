"use client";

import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Fixture } from "@/lib/football-api";
import { ChevronRight } from "lucide-react";
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

  const accentBar = isLive
    ? "bg-green-400"
    : isFinished
    ? "bg-zinc-700"
    : "bg-zinc-600";

  const cardBg = isLive
    ? "border-green-500/30 bg-green-950/20"
    : "border-zinc-800/50 bg-zinc-900/80 hover:border-zinc-700/70";

  return (
    <Link href={`/jogo/${f.fixture.id}`}>
      <div
        className={`flex rounded-2xl border overflow-hidden transition-all active:scale-[0.98] animate-fade-in-up ${cardBg}`}
        style={{ animationDelay: `${index * 0.06}s` }}
      >
        {/* Barra lateral colorida */}
        <div className={`w-1 shrink-0 ${accentBar}`} />

        <div className="flex-1 px-3 py-3 space-y-2.5">
          {/* Topo: rodada + data/status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                isLive ? "bg-green-400 animate-pulse" : isFinished ? "bg-zinc-600" : "bg-zinc-500"
              }`} />
              <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider truncate max-w-40">
                {f.league.round}
              </span>
            </div>

            {isLive ? (
              <span className="text-[10px] text-green-400 font-black bg-green-500/10 border border-green-500/25 rounded-full px-2 py-0.5">
                AO VIVO {f.fixture.status.elapsed ? `${f.fixture.status.elapsed}'` : ""}
              </span>
            ) : isFinished ? (
              <span className="text-[10px] text-zinc-600">Encerrado</span>
            ) : (
              <div className="flex items-center gap-2">
                {isUpcoming && <Countdown date={f.fixture.date} />}
                <span className="text-[10px] text-zinc-600">
                  {format(date, "dd/MM", { locale: ptBR })}
                </span>
              </div>
            )}
          </div>

          {/* Times + placar/horário */}
          <div className="flex items-center gap-2">
            {/* Time da casa */}
            <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
              <div className="w-11 h-11 relative">
                <Image src={f.teams.home.logo} alt={f.teams.home.name} fill className="object-contain" sizes="44px" />
              </div>
              <span className={`text-[11px] font-bold text-center leading-tight line-clamp-2 w-full ${
                isFinished && f.teams.home.winner === true ? "text-white" :
                isFinished ? "text-zinc-500" : "text-zinc-300"
              }`}>
                {f.teams.home.name}
              </span>
            </div>

            {/* Placar / Horário */}
            <div className="flex flex-col items-center shrink-0 px-1 gap-1">
              {f.goals.home !== null ? (
                <span className={`text-2xl font-black tracking-tight leading-none ${
                  isLive ? "text-green-300 score-pulse" : "text-white"
                }`}>
                  {f.goals.home} – {f.goals.away}
                </span>
              ) : (
                <span className="text-2xl font-black text-zinc-300 tracking-tight leading-none">
                  {format(date, "HH:mm")}
                </span>
              )}
              {isFinished && f.score?.halftime?.home !== null && (
                <span className="text-[9px] text-zinc-700">
                  ({f.score.halftime.home}–{f.score.halftime.away})
                </span>
              )}
            </div>

            {/* Time visitante */}
            <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
              <div className="w-11 h-11 relative">
                <Image src={f.teams.away.logo} alt={f.teams.away.name} fill className="object-contain" sizes="44px" />
              </div>
              <span className={`text-[11px] font-bold text-center leading-tight line-clamp-2 w-full ${
                isFinished && f.teams.away.winner === true ? "text-white" :
                isFinished ? "text-zinc-500" : "text-zinc-300"
              }`}>
                {f.teams.away.name}
              </span>
            </div>
          </div>

          {/* Rodapé */}
          <div className="flex items-center justify-between pt-0.5">
            <span className="text-[10px] text-zinc-700 truncate max-w-[60%]">
              {f.fixture.venue.name}
            </span>
            <div className="flex items-center gap-0.5 text-zinc-500">
              <span className="text-[10px] font-medium">Ver análise</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
