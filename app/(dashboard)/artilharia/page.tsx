import Image from "next/image";
import { getScorers } from "@/lib/football-api";
import { Trophy, Target } from "lucide-react";

export const revalidate = 600;

export default async function ArtilhariaPage() {
  const scorers = await getScorers(30);

  if (scorers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-3">
        <Trophy className="w-10 h-10 text-zinc-700" />
        <p className="text-zinc-300 font-bold">Artilharia em breve</p>
        <p className="text-zinc-600 text-sm max-w-xs">
          A tabela de artilharia será exibida após o início dos jogos.
        </p>
      </div>
    );
  }

  const top3 = scorers.slice(0, 3);
  const rest = scorers.slice(3);

  const podiumColors = [
    "from-yellow-500/20 to-yellow-500/5 border-yellow-500/30",
    "from-zinc-400/20 to-zinc-400/5 border-zinc-400/30",
    "from-amber-700/20 to-amber-700/5 border-amber-700/30",
  ];
  const podiumLabels = ["🥇", "🥈", "🥉"];

  return (
    <div className="space-y-5 page-transition">
      <div className="flex items-center gap-2">
        <Trophy className="w-4 h-4 text-yellow-400" />
        <h1 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Artilharia</h1>
      </div>

      {/* Pódio top 3 */}
      <div className="grid grid-cols-3 gap-2">
        {top3.map((s, i) => (
          <div
            key={s.player.id}
            className={`rounded-2xl border bg-linear-to-b p-3 flex flex-col items-center gap-2 text-center ${podiumColors[i]} animate-fade-in-up`}
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            <span className="text-lg">{podiumLabels[i]}</span>
            {s.team.crest ? (
              <div className="w-9 h-9 relative">
                <Image src={s.team.crest} alt={s.team.name} fill className="object-contain" sizes="36px" />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-full bg-zinc-700" />
            )}
            <div>
              <p className="text-xs font-black text-white leading-tight">
                {s.player.name.split(" ").slice(-1)[0]}
              </p>
              <p className="text-[10px] text-zinc-500 mt-0.5">{s.team.name}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-black text-white">{s.goals}</span>
              <span className="text-[10px] text-zinc-500 leading-tight">gols</span>
            </div>
            {s.assists > 0 && (
              <span className="text-[10px] text-zinc-500">{s.assists} assist.</span>
            )}
          </div>
        ))}
      </div>

      {/* Lista restante */}
      {rest.length > 0 && (
        <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/80 overflow-hidden">
          <div className="px-4 py-2.5 bg-zinc-800/40 border-b border-zinc-800/60 flex items-center gap-2">
            <Target className="w-3.5 h-3.5 text-zinc-500" />
            <h2 className="text-xs font-black text-zinc-400 uppercase tracking-wider">Classificação Completa</h2>
          </div>
          <div className="divide-y divide-zinc-800/40">
            {rest.map((s, i) => (
              <div
                key={s.player.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/30 transition-colors animate-fade-in-up"
                style={{ animationDelay: `${(i + 3) * 0.04}s` }}
              >
                <span className="text-xs font-black text-zinc-600 w-4 text-right shrink-0">{i + 4}</span>
                {s.team.crest ? (
                  <div className="w-7 h-7 relative shrink-0">
                    <Image src={s.team.crest} alt={s.team.name} fill className="object-contain" sizes="28px" />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-zinc-700 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-200 truncate">{s.player.name}</p>
                  <p className="text-[10px] text-zinc-600">{s.team.name}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-black text-white">{s.goals}</p>
                    <p className="text-[10px] text-zinc-600">gols</p>
                  </div>
                  {s.assists > 0 && (
                    <div className="text-right">
                      <p className="text-xs font-bold text-zinc-400">{s.assists}</p>
                      <p className="text-[10px] text-zinc-600">assist.</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-[10px] text-zinc-700 text-center pb-2">
        Dados via football-data.org · atualizado a cada 10min
      </p>
    </div>
  );
}
